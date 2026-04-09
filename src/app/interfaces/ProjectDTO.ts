export interface ProjectDTO {
    projectID: number;
    projectName: string;
    description: string;
    startDate: Date;
    endDate: Date;
    createdAt: Date;
    archived: boolean;
    deletedAt?: Date;
    createdBy: number;
    modifiedBy: number;
}