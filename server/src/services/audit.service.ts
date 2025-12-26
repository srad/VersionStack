import { injectable } from 'tsyringe';
import { AuditRepository, AuditFilters, PaginationParams } from '../repositories/audit.repository';
import { AuditLogResponse, toAuditLogResponse } from '../types';

export interface AuditListResult {
  data: AuditLogResponse[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

@injectable()
export class AuditService {
  constructor(private auditRepo: AuditRepository) {}

  async listAuditLogs(
    filters: AuditFilters,
    pagination: PaginationParams
  ): Promise<AuditListResult> {
    const [logs, total] = await Promise.all([
      this.auditRepo.findWithFilters(filters, pagination),
      this.auditRepo.countWithFilters(filters),
    ]);

    return {
      data: logs.map(toAuditLogResponse),
      pagination: {
        total,
        limit: pagination.limit,
        offset: pagination.offset,
      },
    };
  }
}
