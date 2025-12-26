import { injectable, inject } from 'tsyringe';
import { Database } from 'sqlite';
import { BaseRepository, DATABASE_TOKEN } from './base.repository';
import { AuditLog } from '../types';

export interface AuditLogWithActor extends AuditLog {
  actor_key_name?: string;
}

export interface AuditFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
}

export interface PaginationParams {
  limit: number;
  offset: number;
}

export interface CreateAuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  actorKeyId: number | null;
  actorIp: string | null;
  details?: Record<string, unknown>;
}

@injectable()
export class AuditRepository extends BaseRepository {
  constructor(@inject(DATABASE_TOKEN) db: Database) {
    super(db);
  }

  async findWithFilters(
    filters: AuditFilters,
    pagination: PaginationParams
  ): Promise<AuditLogWithActor[]> {
    const { query, params } = this.buildQuery(filters);
    const fullQuery = `${query} ORDER BY audit_log.created_at DESC LIMIT ? OFFSET ?`;
    params.push(pagination.limit, pagination.offset);

    return this.executeAll<AuditLogWithActor>(fullQuery, ...params);
  }

  async countWithFilters(filters: AuditFilters): Promise<number> {
    const { whereClause, params } = this.buildWhereClause(filters);
    const query = `SELECT COUNT(*) as total FROM audit_log ${whereClause}`;
    const result = await this.executeGet<{ total: number }>(query, ...params);
    return result?.total ?? 0;
  }

  async create(data: CreateAuditLogData): Promise<void> {
    const detailsJson = data.details ? JSON.stringify(data.details) : null;

    await this.executeRun(
      `INSERT INTO audit_log (action, entity_type, entity_id, actor_key_id, actor_ip, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      data.action,
      data.entityType,
      data.entityId ?? null,
      data.actorKeyId,
      data.actorIp,
      detailsJson
    );
  }

  private buildQuery(filters: AuditFilters): { query: string; params: (string | number)[] } {
    const { whereClause, params } = this.buildWhereClause(filters);

    const query = `
      SELECT
        audit_log.*,
        api_keys.name as actor_key_name
      FROM audit_log
      LEFT JOIN api_keys ON audit_log.actor_key_id = api_keys.id
      ${whereClause}
    `;

    return { query, params };
  }

  private buildWhereClause(filters: AuditFilters): { whereClause: string; params: string[] } {
    const conditions: string[] = [];
    const params: string[] = [];

    if (filters.action) {
      conditions.push('audit_log.action = ?');
      params.push(filters.action);
    }

    if (filters.entityType) {
      conditions.push('audit_log.entity_type = ?');
      params.push(filters.entityType);
    }

    if (filters.entityId) {
      conditions.push('audit_log.entity_id = ?');
      params.push(filters.entityId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    return { whereClause, params };
  }
}
