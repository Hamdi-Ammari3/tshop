import { NextResponse } from "next/server";
import { getTwilioClient, VERIFY_SERVICE_SID, toE164Tunisia } from "../../../../lib/twilio";
import { adminAuth, adminDB } from "../../../../lib/firebaseAdmin";

export async function POST(request) {
    try {
        const { phone, code, name, mode } = await request.json();

        // Validate inputs
        const e164 = toE164Tunisia(phone || "");
        if (!e164) {
            return NextResponse.json({ error: "Numéro invalide." }, { status: 400 });
        }
        if (!/^\d{4,6}$/.test(String(code || "").trim())) {
            return NextResponse.json({ error: "Code invalide." }, { status: 400 });
        }
        if (mode !== "login" && mode !== "signup" && mode !== "checkout") {
            return NextResponse.json({ error: "Mode invalide." }, { status: 400 });
        }

        const uid     = `tn${e164.replace("+", "")}`;
        const userRef = adminDB.collection("users").doc(uid);
        const snap    = await userRef.get();
        const exists  = snap.exists;

        // "login" and "signup" keep their strict guards (used by the
        // dedicated login page). "checkout" is deliberately permissive —
        // it will create the account if missing or log in if it exists.
        if (mode === "signup" && exists) {
            return NextResponse.json(
                { error: "Un compte existe déjà avec ce numéro." },
                { status: 409 }
            );
        }

        if (mode === "login" && !exists) {
            return NextResponse.json(
                { error: "Aucun compte trouvé avec ce numéro." },
                { status: 404 }
            );
        }

        // Verify OTP with Twilio
        const client = getTwilioClient();
        const check  = await client.verify.v2
            .services(VERIFY_SERVICE_SID)
            .verificationChecks.create({ to: e164, code: String(code).trim() });

        if (check.status !== "approved") {
            return NextResponse.json(
                { error: "Code incorrect ou expiré." },
                { status: 401 }
            );
        }

        // Write to Firestore. A new account is created whenever the doc
        // doesn't exist yet — this covers both "signup" mode and a
        // first-time "checkout" customer. An existing account is only
        // ever touched for lastLoginAt, never renamed.
        if (!exists) {
            await userRef.set({
                name:        (name || "").trim() || "Utilisateur",
                phone:       e164,
                storeId:     null,
                createdAt:   new Date().toISOString(),
                lastLoginAt: new Date().toISOString(),
            });
        } else {
            await userRef.update({ lastLoginAt: new Date().toISOString() });
        }

        const userDoc     = (await userRef.get()).data();
        const customToken = await adminAuth.createCustomToken(uid);

        return NextResponse.json({
            token: customToken,
            user: {
                uid,
                name:    userDoc.name,
                phone:   userDoc.phone,
                storeId: userDoc.storeId ?? null,
            },
        });

    } catch (err) {
        console.error("verify-otp error:", err);

        if (err.code === 60200) {
            return NextResponse.json({ error: "Numéro invalide." }, { status: 400 });
        }
        if (err.code === 20404) {
            return NextResponse.json(
                { error: "Aucun code en attente pour ce numéro." },
                { status: 400 }
            );
        }

        return NextResponse.json({ error: "Échec de la vérification." }, { status: 500 });
    }
}