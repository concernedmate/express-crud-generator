# CRUD GENERATOR EXPRESS

how to use:

    node index.js table {$tablename or 'all'} -mysql
    node index.js table admin -mysql (create cruds for table admin)
    node index.js table all -mysql (create cruds for all tables)

options:

    -mysql
    -mssql
    -withmiddleware

package used on the template:
- joi
- mysql2
- express