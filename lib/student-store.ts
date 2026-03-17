import { Student } from '@/lib/domain';
import { supabaseServer } from '@/lib/supabase-server';
import { promises as fs } from 'node:fs';
import path from 'node:path';

type StudentRow = {
  id: string;
  full_name: string;
  phone: string;
  created_at: string;
};

const localStudentsPath = path.join(process.cwd(), 'data', 'students.json');

function isSupabaseUnavailable(errorMessage: string): boolean {
  const normalized = errorMessage.toLowerCase();
  return normalized.includes('fetch failed') || normalized.includes('failed to fetch');
}

async function readLocalStudents(): Promise<Student[]> {
  const raw = await fs.readFile(localStudentsPath, 'utf-8');
  const parsed = JSON.parse(raw) as Student[];
  return parsed;
}

async function writeLocalStudents(students: Student[]): Promise<void> {
  await fs.writeFile(localStudentsPath, `${JSON.stringify(students, null, 2)}\n`, 'utf-8');
}

function mapStudent(row: StudentRow): Student {
  return {
    id: row.id,
    fullName: row.full_name,
    phone: row.phone,
    createdAt: row.created_at.slice(0, 10)
  };
}

export async function readStudents(): Promise<Student[]> {
  const { data, error } = await supabaseServer
    .from('students')
    .select('id, full_name, phone, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    if (isSupabaseUnavailable(error.message)) {
      console.warn('Supabase unreachable, using local students fallback for readStudents');
      return readLocalStudents();
    }
    throw new Error(`Failed to read students: ${error.message}`);
  }

  return (data ?? []).map((row) => mapStudent(row as StudentRow));
}

export async function getStudentById(id: string): Promise<Student | null> {
  const { data, error } = await supabaseServer
    .from('students')
    .select('id, full_name, phone, created_at')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (isSupabaseUnavailable(error.message)) {
      const localStudents = await readLocalStudents();
      return localStudents.find((student) => student.id === id) ?? null;
    }
    throw new Error(`Failed to read student: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapStudent(data as StudentRow);
}

export async function createStudent(payload: Pick<Student, 'fullName' | 'phone'>): Promise<Student> {
  const id = crypto.randomUUID();

  const { data, error } = await supabaseServer
    .from('students')
    .insert({ id, full_name: payload.fullName.trim(), phone: payload.phone.trim() })
    .select('id, full_name, phone, created_at')
    .single();

  if (error) {
    if (isSupabaseUnavailable(error.message)) {
      const localStudents = await readLocalStudents();
      const created: Student = {
        id,
        fullName: payload.fullName.trim(),
        phone: payload.phone.trim(),
        createdAt: new Date().toISOString().slice(0, 10)
      };
      localStudents.push(created);
      await writeLocalStudents(localStudents);
      return created;
    }
    throw new Error(`Failed to create student: ${error.message}`);
  }

  return mapStudent(data as StudentRow);
}

export async function updateStudent(
  id: string,
  payload: Partial<Pick<Student, 'fullName' | 'phone'>>
): Promise<Student | null> {
  const updates: Record<string, string> = {};

  if (payload.fullName !== undefined) {
    updates.full_name = payload.fullName.trim();
  }

  if (payload.phone !== undefined) {
    updates.phone = payload.phone.trim();
  }

  const { data, error } = await supabaseServer
    .from('students')
    .update(updates)
    .eq('id', id)
    .select('id, full_name, phone, created_at')
    .maybeSingle();

  if (error) {
    if (isSupabaseUnavailable(error.message)) {
      const localStudents = await readLocalStudents();
      const index = localStudents.findIndex((student) => student.id === id);

      if (index === -1) {
        return null;
      }

      const existing = localStudents[index];
      localStudents[index] = {
        ...existing,
        fullName: payload.fullName !== undefined ? payload.fullName.trim() : existing.fullName,
        phone: payload.phone !== undefined ? payload.phone.trim() : existing.phone
      };

      await writeLocalStudents(localStudents);
      return localStudents[index];
    }
    throw new Error(`Failed to update student: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return mapStudent(data as StudentRow);
}
