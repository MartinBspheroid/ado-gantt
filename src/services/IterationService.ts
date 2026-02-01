import * as SDK from "azure-devops-extension-sdk";
import { getClient } from "azure-devops-extension-api";
import { WorkItemTrackingRestClient } from "azure-devops-extension-api/WorkItemTracking";
import { WorkItemTrackingProcessRestClient } from "azure-devops-extension-api/WorkItemTrackingProcess";

/**
 * Iteration information
 */
export interface IterationInfo {
  id: string;
  name: string;
  path: string;
  startDate?: Date;
  finishDate?: Date;
  isCurrent: boolean;
}

/**
 * Service for handling iteration-related functionality
 * including @CurrentIteration +/- n syntax support
 * Ported from EPAM's ado-delivery-gantt implementation
 */
export class IterationService {
  private witClient: WorkItemTrackingRestClient | null = null;
  private projectName: string = "";
  private teamName: string = "";
  private iterationsCache: IterationInfo[] | null = null;
  
  async initialize(): Promise<void> {
    await SDK.init();
    await SDK.ready();
    
    this.witClient = getClient(WorkItemTrackingRestClient);
    
    const context = SDK.getWebContext();
    this.projectName = context.project?.name || "";
    this.teamName = context.team?.name || "";
  }
  
  /**
   * Parse iteration macro syntax and return actual iteration path
   * 
   * Supports:
   * - @CurrentIteration
   * - @CurrentIteration-1 (previous iteration)
   * - @CurrentIteration+1 (next iteration)
   * - @CurrentIteration-2, @CurrentIteration+2, etc.
   * 
   * @param macro The iteration macro (e.g., "@CurrentIteration-1")
   * @returns The actual iteration path or null if not found
   */
  async resolveIterationMacro(macro: string): Promise<string | null> {
    const match = macro.match(/@CurrentIteration(?:\s*([+-])\s*(\d+))?/i);
    if (!match) {
      // Not a macro, return as-is
      return macro;
    }
    
    const offset = match[1] && match[2] 
      ? parseInt(match[1] + match[2], 10) 
      : 0;
    
    const iterations = await this.getTeamIterations();
    if (!iterations || iterations.length === 0) {
      return null;
    }
    
    // Find current iteration
    const currentIndex = iterations.findIndex(i => i.isCurrent);
    if (currentIndex === -1) {
      // No current iteration found, try to find based on dates
      const now = new Date();
      const activeIndex = iterations.findIndex(i => {
        if (i.startDate && i.finishDate) {
          return now >= i.startDate && now <= i.finishDate;
        }
        return false;
      });
      
      if (activeIndex === -1) {
        return null;
      }
      
      const targetIndex = activeIndex + offset;
      if (targetIndex < 0 || targetIndex >= iterations.length) {
        return null;
      }
      
      return iterations[targetIndex].path;
    }
    
    // Apply offset to current iteration
    const targetIndex = currentIndex + offset;
    if (targetIndex < 0 || targetIndex >= iterations.length) {
      return null;
    }
    
    return iterations[targetIndex].path;
  }
  
  /**
   * Check if a string contains iteration macros
   */
  containsIterationMacro(value: string): boolean {
    return /@CurrentIteration/i.test(value);
  }
  
  /**
   * Get all team iterations
   */
  async getTeamIterations(): Promise<IterationInfo[]> {
    if (this.iterationsCache) {
      return this.iterationsCache;
    }
    
    if (!this.witClient) {
      throw new Error("Service not initialized");
    }
    
    try {
      // Get team context
      const teamContext = {
        project: this.projectName,
        team: this.teamName
      };
      
      // Fetch iterations from ADO API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const classificationNodes = await (this.witClient as any).getClassificationNodes(
        this.projectName,
        2 // Iterations tree depth
      );
      
      const iterations = this.parseIterations(classificationNodes);
      this.iterationsCache = iterations;
      return iterations;
    } catch (error) {
      console.error('Error fetching team iterations:', error);
      return [];
    }
  }
  
  /**
   * Get current iteration
   */
  async getCurrentIteration(): Promise<IterationInfo | null> {
    const iterations = await this.getTeamIterations();
    return iterations.find(i => i.isCurrent) || null;
  }
  
  /**
   * Get available iteration paths for dropdown
   */
  async getAvailableIterationPaths(): Promise<string[]> {
    const iterations = await this.getTeamIterations();
    return iterations.map(i => i.path);
  }
  
  /**
   * Get iteration macro options for UI
   */
  getIterationMacroOptions(): { value: string; label: string }[] {
    return [
      { value: '@CurrentIteration', label: 'Current Iteration' },
      { value: '@CurrentIteration-1', label: 'Previous Iteration' },
      { value: '@CurrentIteration-2', label: '2 Iterations Ago' },
      { value: '@CurrentIteration-3', label: '3 Iterations Ago' },
      { value: '@CurrentIteration+1', label: 'Next Iteration' },
      { value: '@CurrentIteration+2', label: '2 Iterations Ahead' },
      { value: '@CurrentIteration+3', label: '3 Iterations Ahead' }
    ];
  }
  
  /**
   * Clear iterations cache (useful when iterations change)
   */
  clearCache(): void {
    this.iterationsCache = null;
  }
  
  /**
   * Build WIQL query with resolved iteration macros
   */
  async buildWiqlWithIterations(baseQuery: string): Promise<string> {
    let query = baseQuery;
    
    // Find all iteration macros in the query
    const macroRegex = /@CurrentIteration(?:\s*[+-]\s*\d+)?/gi;
    const macros = query.match(macroRegex);
    
    if (macros) {
      for (const macro of macros) {
        const resolvedPath = await this.resolveIterationMacro(macro);
        if (resolvedPath) {
          // Escape single quotes in the path
          const escapedPath = resolvedPath.replace(/'/g, "''");
          query = query.replace(macro, `'${escapedPath}'`);
        }
      }
    }
    
    return query;
  }
  
  /**
   * Get iteration name from path
   */
  getIterationNameFromPath(path: string): string {
    const parts = path.split('\\');
    return parts[parts.length - 1] || path;
  }
  
  private parseIterations(classificationNodes: any): IterationInfo[] {
    const iterations: IterationInfo[] = [];
    const now = new Date();
    
    const processNode = (node: any, parentPath: string = '') => {
      if (!node) return;
      
      const currentPath = parentPath 
        ? `${parentPath}\\${node.name}` 
        : node.name;
      
      if (node.structureType === 2) { // Iteration type
        const startDate = node.attributes?.startDate 
          ? new Date(node.attributes.startDate) 
          : undefined;
        const finishDate = node.attributes?.finishDate 
          ? new Date(node.attributes.finishDate) 
          : undefined;
        
        const isCurrent = startDate && finishDate 
          ? now >= startDate && now <= finishDate 
          : false;
        
        iterations.push({
          id: node.identifier || node.id,
          name: node.name,
          path: currentPath,
          startDate,
          finishDate,
          isCurrent
        });
      }
      
      // Process children
      if (node.children) {
        for (const child of node.children) {
          processNode(child, currentPath);
        }
      }
    };
    
    if (classificationNodes) {
      processNode(classificationNodes);
    }
    
    // Sort by start date
    return iterations.sort((a, b) => {
      if (a.startDate && b.startDate) {
        return a.startDate.getTime() - b.startDate.getTime();
      }
      return a.name.localeCompare(b.name);
    });
  }
}

export const iterationService = new IterationService();
