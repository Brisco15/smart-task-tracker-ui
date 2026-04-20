export interface TaskDTO {
    taskID: number;
    title: string;
    description: string;
    projectID: number;
    statusID: number;
    priorityID: number;
    assignedTo: number;
    createdAt: Date;
    createdBy: number;
    deletedAt?: Date;
    deletedBy?: number;
    modifiedAt?: Date;
    modifiedBy?: number;
    archived: boolean;
    archivedBy?: number;
}