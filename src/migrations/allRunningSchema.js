import createUserTable from "./schemaUser.js";

export default function runMigrations(db) {
    createUserTable(db);

    console.log(`==========================================\nAll running migrations and executed....`);
}