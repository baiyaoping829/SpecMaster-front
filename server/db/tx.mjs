export const withTransaction = async (db, options, fn) => {
  const isolationLevel = options?.isolationLevel || 'read committed'
  const accessMode = options?.accessMode
  let builder = db.transaction()
  if (accessMode) builder = builder.setAccessMode(accessMode)
  if (isolationLevel) builder = builder.setIsolationLevel(isolationLevel)
  return builder.execute(fn)
}

export const optimisticUpdateById = async (trx, table, id, version, patch) => {
  const result = await trx
    .updateTable(table)
    .set({ ...patch, version: version + 1 })
    .where('id', '=', id)
    .where('version', '=', version)
    .executeTakeFirst()

  const rows = Number(result?.numUpdatedRows || 0)
  if (rows !== 1) {
    const error = new Error('conflict')
    error.code = 'CONFLICT'
    throw error
  }
}

