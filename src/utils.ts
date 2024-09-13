import fs from 'fs'
import path from 'path'

export function copy_dir_sync(
  source_dir: fs.PathLike,
  target_dir: fs.PathLike,
  overwrite = false
): void {
  if (fs.existsSync(target_dir) && overwrite) {
    fs.rmSync(target_dir, { recursive: true, force: true })
  }

  fs.mkdirSync(target_dir)
  for (const file of fs.readdirSync(source_dir)) {
    const source_path = path.join(source_dir.toString(), file)
    const target_path = path.join(target_dir.toString(), file)
    if (fs.lstatSync(source_path).isDirectory()) {
      fs.mkdirSync(target_path)
    } else {
      fs.copyFileSync(source_path, target_path)
    }
  }
}

export function get_mtimes_sync(dir: fs.PathLike): Record<string, Date> {
  const mtimes: Record<string, Date> = {}
  for (const file of fs.readdirSync(dir)) {
    const full_path = path.join(dir.toString(), file)
    mtimes[full_path] = fs.lstatSync(full_path).mtime
  }
  return mtimes
}
