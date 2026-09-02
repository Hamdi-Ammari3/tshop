import { NextResponse } from "next/server";
import { sendVerificationPreferWhatsapp, toE164Tunisia } from "../../../../lib/twilio";
import { adminDB } from "../../../../lib/firebaseAdmin";

export async function POST(request) {
    try {
        const { phone, mode } = await request.json();

        // Validate phone
        const e164 = toE164Tunisia(phone || "");
        if (!e164) {
            return NextResponse.json(
                { error: "Numéro invalide (8 chiffres attendus)." },
                { status: 400 }
            );
        }

        // Validate mode
        if (mode !== "login" && mode !== "signup" && mode !== "checkout") {
            return NextResponse.json(
                { error: "Mode invalide." },
                { status: 400 }
            );
        }

        if (mode !== "checkout") {
            const uid     = `tn${e164.replace("+", "")}`;
            const userRef = adminDB.collection("users").doc(uid);
            const snap    = await userRef.get();
            const exists  = snap.exists;

            if (mode === "signup" && exists) {
                return NextResponse.json(
                    { error: "Un compte existe déjà avec ce numéro. Veuillez vous connecter." },
                    { status: 409 }
                );
            }

            if (mode === "login" && !exists) {
                return NextResponse.json(
                    { error: "Aucun compte trouvé avec ce numéro. Veuillez créer un compte." },
                    { status: 404 }
                );
            }
        }

        // All clear — send the OTP
        const { channel } = await sendVerificationPreferWhatsapp(e164);

        return NextResponse.json({ ok: true, channel });

    } catch (err) {
        console.error("send-otp error:", err);

        if (err.code === 60203) {
            return NextResponse.json(
                { error: "Trop de tentatives. Réessayez plus tard." },
                { status: 429 }
            );
        }

        return NextResponse.json(
            { error: "Impossible d'envoyer le code. Réessayez." },
            { status: 500 }
        );
    }
}