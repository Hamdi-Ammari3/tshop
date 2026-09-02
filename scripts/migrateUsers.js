// scripts/migrateUsers.js
// Run: node scripts/migrateUsers.js

require("dotenv").config();

const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore }        = require("firebase-admin/firestore");

// ── Init ──────────────────────────────────────────────────────────────────────

const app = initializeApp({
    credential: cert({
        projectId:   process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey:  process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
});

const DB = getFirestore(app);

// ── Helpers ───────────────────────────────────────────────────────────────────

function toE164Tunisia(raw) {
    const digits = String(raw || "").replace(/\D/g, "");
    if (digits.length === 11 && digits.startsWith("216")) return `+216${digits.slice(3)}`;
    if (digits.length === 8) return `+216${digits}`;
    return null;
}

function phoneToUid(e164) {
    // "+216XXXXXXXX" → "tn216XXXXXXXX"  (same pattern as verify-otp route)
    return `tn${e164.replace("+", "")}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function migrate() {

    console.log("── Starting migration ───────────────────────────────");

    const usersSnap = await DB.collection("users").get();

    if (usersSnap.empty) {
        console.log("No user docs found. Exiting.");
        return;
    }

    let created = 0;
    let skipped = 0;
    let noPhone = 0;
    let errors  = 0;

    for (const userDoc of usersSnap.docs) {

        const uid  = userDoc.id;
        const data = userDoc.data();

        // Already a new-structure doc — skip
        if (uid.startsWith("tn")) {
            console.log(`→ Already migrated, skipping: ${uid}`);
            skipped++;
            continue;
        }

        // No storeId → no phone source — skip
        if (!data.storeId) {
            console.log(`⚠ No storeId for ${uid} — skipping`);
            noPhone++;
            continue;
        }

        try {

            // Fetch store doc to get phone
            const storeSnap = await DB.collection("stores").doc(data.storeId).get();

            if (!storeSnap.exists) {
                console.log(`⚠ Store "${data.storeId}" not found for ${uid} — skipping`);
                noPhone++;
                continue;
            }

            const storeData = storeSnap.data();
            const e164      = toE164Tunisia(storeData.phone);

            if (!e164) {
                console.log(`⚠ Could not parse phone "${storeData.phone}" for store "${data.storeId}" — skipping`);
                noPhone++;
                continue;
            }

            const newUid = phoneToUid(e164);

            // Don't overwrite if new doc already exists
            const existing = await DB.collection("users").doc(newUid).get();
            if (existing.exists) {
                console.log(`→ Doc already exists for ${newUid} — skipping`);
                skipped++;
                continue;
            }

            // Create new user doc with new structure
            const newDoc = {
                name:        (data.name || storeData.name || "Utilisateur").trim(),
                phone:       e164,
                storeId:     data.storeId,
                createdAt:   data.createdAt || new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
            };

            await DB.collection("users").doc(newUid).set(newDoc);

            console.log(`✓ Created: ${newUid}`);
            console.log(`  name=${newDoc.name}  phone=${newDoc.phone}  storeId=${newDoc.storeId}`);

            created++;

        } catch (err) {
            console.error(`✗ Error processing ${uid}:`, err.message);
            errors++;
        }
    }

    console.log("\n── Migration complete ───────────────────────────────");
    console.log(`New docs created : ${created}`);
    console.log(`Skipped          : ${skipped}`);
    console.log(`No phone found   : ${noPhone}`);
    console.log(`Errors           : ${errors}`);

    process.exit(0);
}

migrate().catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
});