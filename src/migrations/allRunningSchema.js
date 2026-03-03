import createMessageTable from "./schemaMessage.js";
import createUserTable from "./schemaUser.js";

export default function runMigrations(db) {
    createUserTable(db);
    createMessageTable(db);

    console.log(`==========================================\nAll running migrations and executed....\n==========================================`);
}