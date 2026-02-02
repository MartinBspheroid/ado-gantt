#!/usr/bin/env bun
/**
 * Comprehensive test environment setup for Azure DevOps Gantt Chart testing.
 * Creates iterations (sprints), area paths, and organizes work items.
 */

const ORG = "mblasko42";
const PROJECT = "Foobar";
const PAT = process.env.ITEMS_TEST;

if (!PAT) {
  console.error("Error: ITEMS_TEST environment variable not set");
  process.exit(1);
}

const BASE_URL = `https://dev.azure.com/${ORG}/${PROJECT}`;
const authHeader = `Basic ${Buffer.from(`:${PAT}`).toString("base64")}`;

// Helper for API calls
async function apiCall(
  endpoint: string,
  method: string = "GET",
  body?: object,
  contentType: string = "application/json"
): Promise<any> {
  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: authHeader,
      "Content-Type": contentType,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API call failed: ${response.status} - ${errorText}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

// Helper to format dates
function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ============================================
// CREATE ITERATIONS (SPRINTS)
// ============================================
async function createIteration(
  name: string,
  parentPath: string,
  startDate: Date,
  finishDate: Date
): Promise<boolean> {
  console.log(`Creating iteration: ${name}${parentPath ? ` under ${parentPath}` : ""}...`);

  const iterationPath = parentPath ? `${PROJECT}\\${parentPath}\\${name}` : `${PROJECT}\\${name}`;

  // The API expects the path to the PARENT node, then we create a child
  // For root iterations, we POST to /Iterations
  // For child iterations, we POST to /Iterations/{parentPath}
  const apiPath = parentPath
    ? `/_apis/wit/classificationnodes/Iterations/${encodeURIComponent(parentPath)}?api-version=7.1`
    : `/_apis/wit/classificationnodes/Iterations?api-version=7.1`;

  try {
    await apiCall(
      apiPath,
      "POST",
      {
        name: name,
        attributes: {
          startDate: startDate.toISOString(),
          finishDate: finishDate.toISOString(),
        },
      }
    );
    console.log(`  ✓ Created iteration: ${iterationPath}`);
    return true;
  } catch (error: any) {
    if (error.message.includes("already exists") || error.message.includes("VS402371")) {
      console.log(`  ⚠ Iteration already exists: ${iterationPath}`);
      // Try to update the dates using GET to find the node, then PATCH
      try {
        const getPath = parentPath
          ? `/_apis/wit/classificationnodes/Iterations/${encodeURIComponent(parentPath)}/${encodeURIComponent(name)}?api-version=7.1`
          : `/_apis/wit/classificationnodes/Iterations/${encodeURIComponent(name)}?api-version=7.1`;

        await apiCall(
          getPath,
          "PATCH",
          {
            attributes: {
              startDate: startDate.toISOString(),
              finishDate: finishDate.toISOString(),
            },
          }
        );
        console.log(`  ✓ Updated iteration dates: ${iterationPath}`);
      } catch {
        // Ignore update errors
      }
      return true;
    } else {
      console.error(`  ✗ Failed: ${error.message}`);
      return false;
    }
  }
}

// Verify iterations exist
async function getIterations(): Promise<string[]> {
  try {
    const result = await apiCall(
      `/_apis/wit/classificationnodes/Iterations?$depth=2&api-version=7.1`,
      "GET"
    );

    const iterations: string[] = [];
    function collectIterations(node: any, path: string = "") {
      const nodePath = path ? `${path}\\${node.name}` : node.name;
      iterations.push(nodePath);
      if (node.children) {
        for (const child of node.children) {
          collectIterations(child, nodePath);
        }
      }
    }

    if (result.children) {
      for (const child of result.children) {
        collectIterations(child, PROJECT);
      }
    }

    return iterations;
  } catch (error) {
    console.error("Failed to get iterations:", error);
    return [];
  }
}

// ============================================
// CREATE AREA PATHS
// ============================================
async function createAreaPath(name: string, parentPath?: string): Promise<void> {
  console.log(`Creating area path: ${name}...`);

  const path = parentPath ? `${parentPath}/${name}` : name;

  try {
    await apiCall(
      `/_apis/wit/classificationnodes/Areas/${parentPath ? parentPath + "/" : ""}?api-version=7.1`,
      "POST",
      { name }
    );
    console.log(`  ✓ Created area path: ${PROJECT}\\${path}`);
  } catch (error: any) {
    if (error.message.includes("already exists") || error.message.includes("VS402371")) {
      console.log(`  ⚠ Area path already exists: ${PROJECT}\\${path}`);
    } else {
      console.error(`  ✗ Failed: ${error.message}`);
    }
  }
}

// ============================================
// UPDATE WORK ITEM
// ============================================
async function updateWorkItem(
  id: number,
  fields: Record<string, string | number>
): Promise<void> {
  const patchDocument = Object.entries(fields).map(([path, value]) => ({
    op: "add",
    path: `/fields/${path}`,
    value,
  }));

  if (patchDocument.length === 0) return;

  await apiCall(
    `/_apis/wit/workitems/${id}?api-version=7.1`,
    "PATCH",
    patchDocument,
    "application/json-patch+json"
  );
}

// ============================================
// GET EXISTING WORK ITEMS
// ============================================
async function getWorkItems(): Promise<any[]> {
  const wiql = `
    SELECT [System.Id], [System.Title], [System.WorkItemType]
    FROM workitems
    WHERE [System.TeamProject] = @Project
    AND [System.WorkItemType] IN ('Epic', 'Issue', 'Task')
    ORDER BY [System.Id]
  `;

  const queryResult = await apiCall("/_apis/wit/wiql?api-version=7.1", "POST", {
    query: wiql,
  });

  if (!queryResult.workItems || queryResult.workItems.length === 0) {
    return [];
  }

  const ids = queryResult.workItems.map((wi: any) => wi.id);
  const idsParam = ids.join(",");
  const result = await apiCall(
    `https://dev.azure.com/${ORG}/_apis/wit/workitems?ids=${idsParam}&fields=System.Id,System.Title,System.WorkItemType&api-version=7.1`
  );

  return result.value || [];
}

// ============================================
// DELETE OLD TEST ITEMS
// ============================================
async function deleteWorkItem(id: number): Promise<void> {
  try {
    await apiCall(`/_apis/wit/workitems/${id}?api-version=7.1`, "DELETE");
    console.log(`  ✓ Deleted work item #${id}`);
  } catch (error: any) {
    console.error(`  ✗ Failed to delete #${id}: ${error.message}`);
  }
}

// ============================================
// CREATE WORK ITEM
// ============================================
async function createWorkItem(
  type: string,
  title: string,
  fields: Record<string, string | number | undefined>,
  parentId?: number
): Promise<number> {
  const patchDocument: any[] = [
    { op: "add", path: "/fields/System.Title", value: title },
  ];

  for (const [field, value] of Object.entries(fields)) {
    if (value !== undefined) {
      patchDocument.push({ op: "add", path: `/fields/${field}`, value });
    }
  }

  if (parentId) {
    patchDocument.push({
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Hierarchy-Reverse",
        url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/${parentId}`,
      },
    });
  }

  const result = await apiCall(
    `/_apis/wit/workitems/$${encodeURIComponent(type)}?api-version=7.1`,
    "POST",
    patchDocument,
    "application/json-patch+json"
  );

  console.log(`  ✓ Created ${type} #${result.id}: ${title}`);
  return result.id;
}

// ============================================
// MAIN SETUP
// ============================================
async function main() {
  console.log("=".repeat(70));
  console.log("Setting up comprehensive test environment for Azure DevOps");
  console.log(`Organization: ${ORG}`);
  console.log(`Project: ${PROJECT}`);
  console.log("=".repeat(70));

  const today = new Date();
  // Align to Monday of current week
  const dayOfWeek = today.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const sprintStart = addDays(today, mondayOffset);

  // ============================================
  // STEP 1: Create Iterations (Sprints)
  // ============================================
  console.log("\n📅 STEP 1: Creating Iterations (Sprints)");
  console.log("-".repeat(50));

  // Create Q1 2026 parent iteration
  const q1Created = await createIteration("Q1 2026", "", sprintStart, addDays(sprintStart, 89));

  // Create individual sprints under Q1
  const sprints = [
    { name: "Sprint 1", offset: 0 },
    { name: "Sprint 2", offset: 14 },
    { name: "Sprint 3", offset: 28 },
    { name: "Sprint 4", offset: 42 },
    { name: "Sprint 5", offset: 56 },
    { name: "Sprint 6", offset: 70 },
  ];

  for (const sprint of sprints) {
    const start = addDays(sprintStart, sprint.offset);
    const end = addDays(start, 13); // 2-week sprints
    await createIteration(sprint.name, "Q1 2026", start, end);
  }

  // Verify iterations were created
  console.log("\n  Verifying iterations...");
  const existingIterations = await getIterations();
  console.log(`  Found ${existingIterations.length} iterations:`);
  for (const iter of existingIterations) {
    console.log(`    - ${iter}`);
  }

  // Track if we have the iterations we need
  const hasQ1 = existingIterations.some(i => i.includes("Q1 2026"));
  const hasSprint1 = existingIterations.some(i => i.includes("Sprint 1"));
  if (!hasQ1 || !hasSprint1) {
    console.log("\n  ⚠️  Some iterations may not have been created correctly.");
    console.log("     Work items will be created without sprint assignments.");
  }

  // ============================================
  // STEP 2: Create Area Paths
  // ============================================
  console.log("\n🗂️  STEP 2: Creating Area Paths");
  console.log("-".repeat(50));

  await createAreaPath("Frontend");
  await createAreaPath("Backend");
  await createAreaPath("Infrastructure");
  await createAreaPath("Design");

  // ============================================
  // STEP 3: Clean up old test items with bad dates
  // ============================================
  console.log("\n🧹 STEP 3: Cleaning up old test items");
  console.log("-".repeat(50));

  const existingItems = await getWorkItems();
  const itemsToDelete = existingItems.filter((item) => {
    const title = item.fields["System.Title"] || "";
    return (
      title.includes("Test Task for Gantt") ||
      title.includes("Test for Gantt")
    );
  });

  for (const item of itemsToDelete) {
    await deleteWorkItem(item.id);
  }

  // ============================================
  // STEP 4: Update existing work items with sprints
  // ============================================
  console.log("\n🔄 STEP 4: Updating existing work items with sprint assignments");
  console.log("-".repeat(50));

  const workItems = await getWorkItems();

  // Helper to get iteration path only if it exists
  const getSprint = (sprintName: string) =>
    existingIterations.some(i => i.includes(sprintName)) ? `${PROJECT}\\Q1 2026\\${sprintName}` : undefined;

  // Assign work items to sprints based on their start dates
  for (const item of workItems) {
    const title = item.fields["System.Title"] || "";
    const type = item.fields["System.WorkItemType"] || "";

    // Skip items we might have just created or that are epics
    if (title.includes("Test") || type === "Epic") continue;

    // Determine sprint and area based on work item characteristics
    let sprintName = "Sprint 1";
    let areaName = "";

    // Assign based on title keywords
    if (title.toLowerCase().includes("login") || title.toLowerCase().includes("auth")) {
      sprintName = "Sprint 1";
      areaName = "Backend";
    } else if (title.toLowerCase().includes("dashboard") || title.toLowerCase().includes("chart")) {
      sprintName = "Sprint 3";
      areaName = "Frontend";
    } else if (title.toLowerCase().includes("ci/cd") || title.toLowerCase().includes("staging") || title.toLowerCase().includes("github")) {
      sprintName = "Sprint 2";
      areaName = "Infrastructure";
    } else if (title.toLowerCase().includes("database") || title.toLowerCase().includes("query")) {
      sprintName = "Sprint 4";
      areaName = "Backend";
    } else if (title.toLowerCase().includes("design") || title.toLowerCase().includes("layout")) {
      sprintName = "Sprint 2";
      areaName = "Design";
    } else if (title.toLowerCase().includes("password") || title.toLowerCase().includes("reset")) {
      sprintName = "Sprint 2";
      areaName = "Backend";
    }

    const updates: Record<string, string | number> = {};

    // Only add iteration path if the sprint exists
    const sprintPath = getSprint(sprintName);
    if (sprintPath) {
      updates["System.IterationPath"] = sprintPath;
    }

    // Only add area path if an area was determined
    if (areaName) {
      updates["System.AreaPath"] = `${PROJECT}\\${areaName}`;
    }

    if (Object.keys(updates).length === 0) {
      console.log(`  ⚠ Skipping #${item.id}: No valid updates to apply`);
      continue;
    }

    try {
      await updateWorkItem(item.id, updates);
      console.log(`  ✓ Updated #${item.id}: ${title.substring(0, 40)}... → ${sprintName}, ${areaName || PROJECT}`);
    } catch (error: any) {
      console.error(`  ✗ Failed to update #${item.id}: ${error.message.substring(0, 80)}`);
    }
  }

  // ============================================
  // STEP 5: Create additional test scenarios
  // ============================================
  console.log("\n➕ STEP 5: Creating additional test work items");
  console.log("-".repeat(50));

  // Helper to get iteration path only if it exists
  const getIterPath = (sprint: string) =>
    existingIterations.some(i => i.includes(sprint)) ? `${PROJECT}\\Q1 2026\\${sprint}` : undefined;

  // Helper to get area path only if it exists
  const getAreaPath = (area: string) => `${PROJECT}\\${area}`;

  // Create an Issue for bug testing (Basic template uses Issue, not Bug)
  const issueId = await createWorkItem("Issue", "Login fails with special characters in password", {
    "System.Description": "Users cannot log in if their password contains special characters like & or <",
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 3)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 5)),
    "System.IterationPath": getIterPath("Sprint 1"),
    "System.AreaPath": getAreaPath("Backend"),
    "Microsoft.VSTS.Common.Priority": 1,
  });

  // Create some tasks for the issue
  await createWorkItem("Task", "Investigate special character handling", {
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 3)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 4)),
    "System.IterationPath": getIterPath("Sprint 1"),
    "System.AreaPath": getAreaPath("Backend"),
    "Microsoft.VSTS.Scheduling.RemainingWork": 4,
  }, issueId);

  await createWorkItem("Task", "Fix input sanitization", {
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 4)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 5)),
    "System.IterationPath": getIterPath("Sprint 1"),
    "System.AreaPath": getAreaPath("Backend"),
    "Microsoft.VSTS.Scheduling.RemainingWork": 6,
  }, issueId);

  // Create items in Sprint 5 and 6 for longer timeline view
  const sprint5Issue = await createWorkItem("Issue", "Mobile App Release", {
    "System.Description": "Prepare and release mobile app to app stores",
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 56)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 70)),
    "System.IterationPath": getIterPath("Sprint 5"),
    "System.AreaPath": getAreaPath("Frontend"),
  });

  await createWorkItem("Task", "iOS App Store submission", {
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 56)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 60)),
    "System.IterationPath": getIterPath("Sprint 5"),
    "System.AreaPath": getAreaPath("Frontend"),
    "Microsoft.VSTS.Scheduling.RemainingWork": 8,
  }, sprint5Issue);

  await createWorkItem("Task", "Android Play Store submission", {
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 58)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 62)),
    "System.IterationPath": getIterPath("Sprint 5"),
    "System.AreaPath": getAreaPath("Frontend"),
    "Microsoft.VSTS.Scheduling.RemainingWork": 8,
  }, sprint5Issue);

  // Sprint 6 items
  const sprint6Issue = await createWorkItem("Issue", "Performance Monitoring Setup", {
    "System.Description": "Set up comprehensive performance monitoring and alerting",
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 70)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 84)),
    "System.IterationPath": getIterPath("Sprint 6"),
    "System.AreaPath": getAreaPath("Infrastructure"),
  });

  await createWorkItem("Task", "Configure Datadog APM", {
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 70)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 75)),
    "System.IterationPath": getIterPath("Sprint 6"),
    "System.AreaPath": getAreaPath("Infrastructure"),
    "Microsoft.VSTS.Scheduling.RemainingWork": 12,
  }, sprint6Issue);

  await createWorkItem("Task", "Set up alerting rules", {
    "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(sprintStart, 75)),
    "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(sprintStart, 80)),
    "System.IterationPath": getIterPath("Sprint 6"),
    "System.AreaPath": getAreaPath("Infrastructure"),
    "Microsoft.VSTS.Scheduling.RemainingWork": 8,
  }, sprint6Issue);

  // ============================================
  // SUMMARY
  // ============================================
  console.log("\n" + "=".repeat(70));
  console.log("✅ Test environment setup complete!");
  console.log("=".repeat(70));

  console.log("\n📅 Iterations created:");
  console.log("   └── Q1 2026");
  for (const sprint of sprints) {
    const start = addDays(sprintStart, sprint.offset);
    const end = addDays(start, 13);
    console.log(`       └── ${sprint.name}: ${formatDate(start)} → ${formatDate(end)}`);
  }

  console.log("\n🗂️  Area Paths created:");
  console.log("   └── Frontend");
  console.log("   └── Backend");
  console.log("   └── Infrastructure");
  console.log("   └── Design");

  console.log("\n🔗 View in Azure DevOps:");
  console.log(`   Backlog: https://dev.azure.com/${ORG}/${PROJECT}/_backlogs`);
  console.log(`   Sprints: https://dev.azure.com/${ORG}/${PROJECT}/_sprints`);
  console.log(`   Board:   https://dev.azure.com/${ORG}/${PROJECT}/_boards`);
}

main().catch(console.error);
