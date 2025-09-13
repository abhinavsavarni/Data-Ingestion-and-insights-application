// Database connection setup
import { Pool } from 'pg';
import config from './config.js';

const pool = new Pool(config.database);

export default pool;
