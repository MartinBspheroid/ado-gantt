#!/usr/bin/env bun
/**
 * Script to create test work items in Azure DevOps for Gantt chart testing.
 * Uses Basic process template: Epic > Issue > Task
 * Sets up dates and dependencies.
 */

const ORG = "mblasko42";
const PROJECT = "Foobar";
const PAT = process.env.ITEMS_TEST;

if (!PAT) {
  console.error("Error: ITEMS_TEST environment variable not set");
  console.error("Run with: bun --env-file=.env scripts/create-test-items.ts");
  process.exit(1);
}

const BASE_URL = `https://dev.azure.com/${ORG}/${PROJECT}/_apis/wit/workitems`;
const API_VERSION = "7.1";

// Base64 encode PAT for Basic auth (empty username)
const authHeader = `Basic ${Buffer.from(`:${PAT}`).toString("base64")}`;

interface WorkItemPatch {
  op: "add" | "replace";
  path: string;
  value: string | number | object;
}

interface CreatedWorkItem {
  id: number;
  title: string;
  type: string;
}

async function createWorkItem(
  type: string,
  title: string,
  fields: Record<string, string | number | undefined>,
  parentId?: number
): Promise<CreatedWorkItem> {
  const patchDocument: WorkItemPatch[] = [
    { op: "add", path: "/fields/System.Title", value: title },
  ];

  for (const [field, value] of Object.entries(fields)) {
    if (value !== undefined) {
      patchDocument.push({ op: "add", path: `/fields/${field}`, value });
    }
  }

  // Add parent link if provided
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

  const url = `${BASE_URL}/$${encodeURIComponent(type)}?api-version=${API_VERSION}`;

  console.log(`Creating ${type}: "${title}"...`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(patchDocument),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create ${type}: ${response.status} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`  ✓ Created ${type} #${result.id}: "${title}"`);

  return { id: result.id, title, type };
}

async function addDependencyLink(sourceId: number, targetId: number): Promise<void> {
  const url = `${BASE_URL}/${sourceId}?api-version=${API_VERSION}`;

  const patchDocument = [
    {
      op: "add",
      path: "/relations/-",
      value: {
        rel: "System.LinkTypes.Dependency-Forward",
        url: `https://dev.azure.com/${ORG}/_apis/wit/workItems/${targetId}`,
      },
    },
  ];

  console.log(`Adding dependency: #${sourceId} → #${targetId}...`);

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json-patch+json",
    },
    body: JSON.stringify(patchDocument),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to add dependency: ${response.status} - ${errorText}`);
  }

  console.log(`  ✓ Dependency added`);
}

// Helper to format dates for Azure DevOps
function formatDate(date: Date): string {
  return date.toISOString();
}

// Helper to add days to a date
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Creating test work items in Azure DevOps (Basic Template)");
  console.log(`Organization: ${ORG}`);
  console.log(`Project: ${PROJECT}`);
  console.log("=".repeat(60));

  const today = new Date();
  const createdItems: CreatedWorkItem[] = [];

  try {
    // =====================================================
    // EPIC 1: Q1 Product Launch
    // =====================================================
    const epic1 = await createWorkItem("Epic", "Q1 2026 Product Launch", {
      "System.Description": "Main epic for the Q1 product launch initiative",
      "Microsoft.VSTS.Scheduling.StartDate": formatDate(today),
      "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 90)),
    });
    createdItems.push(epic1);

    // --- Issue 1: Authentication (under Epic 1) ---
    const issue1 = await createWorkItem(
      "Issue",
      "User Authentication System",
      {
        "System.Description": "Implement complete authentication with SSO support",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(today),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 30)),
      },
      epic1.id
    );
    createdItems.push(issue1);

    // Tasks under Issue 1
    const task1 = await createWorkItem(
      "Task",
      "Design login form UI",
      {
        "System.Description": "Create Figma designs for login page",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(today),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 2)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 8,
      },
      issue1.id
    );
    createdItems.push(task1);

    const task2 = await createWorkItem(
      "Task",
      "Implement login API endpoint",
      {
        "System.Description": "Create POST /api/auth/login endpoint",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 1)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 5)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 16,
      },
      issue1.id
    );
    createdItems.push(task2);

    const task3 = await createWorkItem(
      "Task",
      "Build login form component",
      {
        "System.Description": "React component with validation",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 2)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 6)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 12,
      },
      issue1.id
    );
    createdItems.push(task3);

    const task4 = await createWorkItem(
      "Task",
      "Write unit tests for auth service",
      {
        "System.Description": "Jest tests for authentication logic",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 5)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 8)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 8,
      },
      issue1.id
    );
    createdItems.push(task4);

    // --- Issue 2: Password Reset (under Epic 1) ---
    const issue2 = await createWorkItem(
      "Issue",
      "Password Reset Flow",
      {
        "System.Description": "Implement password reset with email verification",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 6)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 15)),
      },
      epic1.id
    );
    createdItems.push(issue2);

    const task5 = await createWorkItem(
      "Task",
      "Create password reset email template",
      {
        "System.Description": "Design email template with reset link",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 6)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 8)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 4,
      },
      issue2.id
    );
    createdItems.push(task5);

    const task6 = await createWorkItem(
      "Task",
      "Implement reset token generation",
      {
        "System.Description": "Secure token generation and validation",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 7)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 10)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 12,
      },
      issue2.id
    );
    createdItems.push(task6);

    // --- Issue 3: Dashboard Analytics (under Epic 1) ---
    const issue3 = await createWorkItem(
      "Issue",
      "Dashboard Analytics",
      {
        "System.Description": "Build analytics dashboard with charts and reports",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 14)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 40)),
      },
      epic1.id
    );
    createdItems.push(issue3);

    const task7 = await createWorkItem(
      "Task",
      "Design dashboard layout",
      {
        "System.Description": "Create wireframes for dashboard widgets",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 14)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 18)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 8,
      },
      issue3.id
    );
    createdItems.push(task7);

    const task8 = await createWorkItem(
      "Task",
      "Implement chart components",
      {
        "System.Description": "Build reusable chart components with D3.js",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 18)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 28)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 24,
      },
      issue3.id
    );
    createdItems.push(task8);

    const task9 = await createWorkItem(
      "Task",
      "Create analytics API endpoints",
      {
        "System.Description": "REST endpoints for dashboard data",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 20)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 30)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 20,
      },
      issue3.id
    );
    createdItems.push(task9);

    // =====================================================
    // EPIC 2: Infrastructure Improvements
    // =====================================================
    const epic2 = await createWorkItem("Epic", "Infrastructure Improvements", {
      "System.Description": "DevOps and infrastructure upgrades for Q1",
      "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 10)),
      "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 60)),
    });
    createdItems.push(epic2);

    // --- Issue 4: CI/CD Pipeline (under Epic 2) ---
    const issue4 = await createWorkItem(
      "Issue",
      "CI/CD Pipeline Setup",
      {
        "System.Description": "Set up automated build and deployment pipelines",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 10)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 25)),
      },
      epic2.id
    );
    createdItems.push(issue4);

    const task10 = await createWorkItem(
      "Task",
      "Configure GitHub Actions workflows",
      {
        "System.Description": "Set up build, test, and deploy workflows",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 10)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 14)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 12,
      },
      issue4.id
    );
    createdItems.push(task10);

    const task11 = await createWorkItem(
      "Task",
      "Set up staging environment",
      {
        "System.Description": "Create staging environment for testing",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 14)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 20)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 16,
      },
      issue4.id
    );
    createdItems.push(task11);

    // --- Issue 5: Database Optimization (under Epic 2) ---
    const issue5 = await createWorkItem(
      "Issue",
      "Database Performance Optimization",
      {
        "System.Description": "Optimize database queries and indexing",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 25)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 45)),
      },
      epic2.id
    );
    createdItems.push(issue5);

    const task12 = await createWorkItem(
      "Task",
      "Analyze slow queries",
      {
        "System.Description": "Identify and analyze slow database queries",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 25)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 30)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 8,
      },
      issue5.id
    );
    createdItems.push(task12);

    const task13 = await createWorkItem(
      "Task",
      "Add database indexes",
      {
        "System.Description": "Create indexes for frequently queried columns",
        "Microsoft.VSTS.Scheduling.StartDate": formatDate(addDays(today, 30)),
        "Microsoft.VSTS.Scheduling.TargetDate": formatDate(addDays(today, 35)),
        "Microsoft.VSTS.Scheduling.RemainingWork": 8,
      },
      issue5.id
    );
    createdItems.push(task13);

    // =====================================================
    // ADD DEPENDENCIES
    // =====================================================
    console.log("\n" + "=".repeat(60));
    console.log("Adding dependencies between items");
    console.log("=".repeat(60));

    // Issue 2 (Password Reset) depends on Issue 1 (Auth) being done
    await addDependencyLink(issue2.id, issue1.id);

    // Issue 3 (Dashboard) depends on Issue 1 (Auth)
    await addDependencyLink(issue3.id, issue1.id);

    // Task 2 (API) depends on Task 1 (design)
    await addDependencyLink(task2.id, task1.id);

    // Task 3 (frontend) depends on Task 1 (design) and Task 2 (API)
    await addDependencyLink(task3.id, task1.id);
    await addDependencyLink(task3.id, task2.id);

    // Task 4 (tests) depends on Task 2 (API)
    await addDependencyLink(task4.id, task2.id);

    // Task 6 (reset tokens) depends on Task 5 (email template)
    await addDependencyLink(task6.id, task5.id);

    // Task 8 (charts) depends on Task 7 (design)
    await addDependencyLink(task8.id, task7.id);

    // Task 9 (analytics API) depends on Task 8 (charts)
    await addDependencyLink(task9.id, task8.id);

    // Task 11 (staging) depends on Task 10 (GitHub Actions)
    await addDependencyLink(task11.id, task10.id);

    // Task 13 (indexes) depends on Task 12 (analyze)
    await addDependencyLink(task13.id, task12.id);

    // Issue 5 (DB optimization) depends on Issue 4 (CI/CD)
    await addDependencyLink(issue5.id, issue4.id);

    // =====================================================
    // SUMMARY
    // =====================================================
    console.log("\n" + "=".repeat(60));
    console.log("✓ Successfully created test work items!");
    console.log("=".repeat(60));

    console.log("\nHierarchy:");
    console.log(`\n📁 Epic #${epic1.id}: ${epic1.title}`);
    console.log(`  📋 Issue #${issue1.id}: ${issue1.title}`);
    console.log(`    ⬜ Task #${task1.id}: ${task1.title}`);
    console.log(`    ⬜ Task #${task2.id}: ${task2.title}`);
    console.log(`    ⬜ Task #${task3.id}: ${task3.title}`);
    console.log(`    ⬜ Task #${task4.id}: ${task4.title}`);
    console.log(`  📋 Issue #${issue2.id}: ${issue2.title}`);
    console.log(`    ⬜ Task #${task5.id}: ${task5.title}`);
    console.log(`    ⬜ Task #${task6.id}: ${task6.title}`);
    console.log(`  📋 Issue #${issue3.id}: ${issue3.title}`);
    console.log(`    ⬜ Task #${task7.id}: ${task7.title}`);
    console.log(`    ⬜ Task #${task8.id}: ${task8.title}`);
    console.log(`    ⬜ Task #${task9.id}: ${task9.title}`);
    console.log(`\n📁 Epic #${epic2.id}: ${epic2.title}`);
    console.log(`  📋 Issue #${issue4.id}: ${issue4.title}`);
    console.log(`    ⬜ Task #${task10.id}: ${task10.title}`);
    console.log(`    ⬜ Task #${task11.id}: ${task11.title}`);
    console.log(`  📋 Issue #${issue5.id}: ${issue5.title}`);
    console.log(`    ⬜ Task #${task12.id}: ${task12.title}`);
    console.log(`    ⬜ Task #${task13.id}: ${task13.title}`);

    console.log(`\nTotal: ${createdItems.length} work items`);
    console.log("\nView in Azure DevOps:");
    console.log(`  https://dev.azure.com/${ORG}/${PROJECT}/_workitems`);
  } catch (error) {
    console.error("\nError:", error);
    process.exit(1);
  }
}

main();
