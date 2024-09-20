import { Client, type QueryResult, ConnectionConfig } from 'pg'

const {
  DATABASE_HOST,
  DATABASE_PORT,
  DATABASE_USERNAME,
  DATABASE_PASSWORD,
  DATABASE_NAME,
} = process.env;

const isLocal = DATABASE_HOST === '127.0.0.1' || DATABASE_HOST === 'localhost';

export const defaultConnection: ConnectionConfig = {
  user: DATABASE_USERNAME,
  password: DATABASE_PASSWORD,
  database: DATABASE_NAME,
  host: DATABASE_HOST,
  port: Number(DATABASE_PORT),
  ...!isLocal && {
    ssl: {
      rejectUnauthorized: false
    }
  },}

export class Database {
  private readonly client: Client
  protected static instance: Database;

  protected constructor (client: Client) {
    this.client = client
  }

  static async connect(connection: ConnectionConfig = defaultConnection): Promise<Database> {
    if (!this.instance) {
      const cl = new Client(connection)
      await cl.connect();
      console.log('[DATABASE] Connected!')
      this.instance = new Database(cl);
    }
    return this.instance;
  }

  async query(query: string, params?: string[]): Promise<any> {
    try {
      const { rows }: QueryResult = await this.client.query(query, params)
      if (rows.length === 1) return rows[0]
      return rows
    } catch (error) {
      console.error('Erro ao executar a query:', error)
      throw error
    }
  }
}
