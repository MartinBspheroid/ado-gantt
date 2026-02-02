import { WorkItem, GanttItem, ProgressStatus, ProgressSummary } from "../types";

/**
 * Service for calculating timeline-based progress status
 * Ported from EPAM's ado-delivery-gantt implementation
 */
export class ProgressCalculationService {
  /**
   * Calculate progress status based on timeline comparison
   * 
   * Rules:
   * - Done: State is 'Closed' or 'Resolved'
   * - Not Started: State is 'New'
   * - Off Track: Current date >= end date && state !== 'Closed'
   * - At Risk: Start date + (duration * 0.5) <= current date < end date
   * - On Track: Current date < start date + (duration * 0.5)
   */
  calculateProgressStatus(workItem: WorkItem): ProgressStatus {
    const currentDate = new Date();
    
    // Done: Closed or Resolved state
    if (workItem.state === 'Closed' || workItem.state === 'Resolved') {
      return 'Done';
    }
    
    // Not Started: New state
    if (workItem.state === 'New') {
      return 'Not Started';
    }
    
    // Calculate dates
    const { startDate, endDate, duration } = this.getWorkItemDates(workItem);
    
    // Off Track: Current date >= end date and not closed
    if (currentDate >= endDate) {
      return 'Off Track';
    }
    
    // Calculate midpoint of duration
    const midpoint = new Date(startDate);
    midpoint.setDate(startDate.getDate() + (duration * 0.5));
    
    // At Risk: Current date is past midpoint but before end date
    if (currentDate >= midpoint && currentDate < endDate) {
      return 'At Risk';
    }
    
    // On Track: Current date is before midpoint
    return 'On Track';
  }
  
  /**
   * Get normalized dates for a work item
   */
  private getWorkItemDates(workItem: WorkItem): { 
    startDate: Date; 
    endDate: Date; 
    duration: number;
  } {
    let startDate: Date;
    let endDate: Date;

    if (workItem.startDate && workItem.targetDate) {
      startDate = workItem.startDate;
      endDate = workItem.targetDate;
    } else if (workItem.startDate) {
      startDate = workItem.startDate;
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);
    } else if (workItem.targetDate) {
      endDate = workItem.targetDate;
      startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - 5);
    } else {
      startDate = workItem.createdDate || new Date();
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);
    }

    if (endDate <= startDate) {
      endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
    }

    const durationMs = endDate.getTime() - startDate.getTime();
    const duration = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    return { startDate, endDate, duration };
  }
  
  /**
   * Calculate progress summary for a set of Gantt items
   */
  calculateProgressSummary(items: GanttItem[]): ProgressSummary {
    const summary: ProgressSummary = {
      notStarted: 0,
      onTrack: 0,
      atRisk: 0,
      offTrack: 0,
      done: 0,
      total: items.length
    };
    
    for (const item of items) {
      switch (item.progressStatus) {
        case 'Not Started':
          summary.notStarted++;
          break;
        case 'On Track':
          summary.onTrack++;
          break;
        case 'At Risk':
          summary.atRisk++;
          break;
        case 'Off Track':
          summary.offTrack++;
          break;
        case 'Done':
          summary.done++;
          break;
      }
    }
    
    return summary;
  }
  
  /**
   * Get status color for a progress status
   */
  getStatusColor(status: ProgressStatus): { color: string; backgroundColor: string } {
    switch (status) {
      case 'Not Started':
        return { color: '#0078d4', backgroundColor: '#deecf9' };
      case 'On Track':
        return { color: '#107c10', backgroundColor: '#dff6dd' };
      case 'At Risk':
        return { color: '#ff8c00', backgroundColor: '#fff4e5' };
      case 'Off Track':
        return { color: '#a80000', backgroundColor: '#fde7e9' };
      case 'Done':
        return { color: '#107c10', backgroundColor: '#107c10' };
      default:
        return { color: '#666666', backgroundColor: '#f3f2f1' };
    }
  }
}

export const progressCalculationService = new ProgressCalculationService();
