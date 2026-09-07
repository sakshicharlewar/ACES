import { getBaseUrl } from "./apiConfig";

export async function syncLocalRegistrationsToServer() {
  try {
    const raw = localStorage.getItem("local_registrations");
    if (!raw) return;
    const localRegs = JSON.parse(raw);
    if (!Array.isArray(localRegs) || localRegs.length === 0) return;

    const apiUrl = getBaseUrl();
    let updated = false;

    for (let i = 0; i < localRegs.length; i++) {
      const reg = localRegs[i];
      // Skip if already synced to server
      if (reg.synced_to_server) continue;

      const eventId = reg.event_id || 12;
      const payload = {
        event_id: eventId,
        team_name: reg.team_name || reg.teamName,
        leader_name: reg.leader_name || reg.leaderName,
        leader_email: reg.leader_email || reg.leaderEmail,
        leader_phone: (reg.leader_phone || reg.leaderPhone || "").replace(/\D/g, "").slice(-10),
        leader_year: reg.leader_year || reg.leaderYear || "Third Year",
        leader_branch: reg.leader_branch || reg.leaderBranch || "Computer Engineering",
        member2_name: reg.member2_name || reg.member2Name || null,
        member2_email: reg.member2_email || reg.member2Email || null,
        member2_phone: (reg.member2_phone || reg.member2Phone || "").replace(/\D/g, "").slice(-10) || null,
        member2_year: reg.member2_year || reg.member2Year || null,
        extra_members: reg.extra_members || reg.extraMembers || null,
        transaction_id: reg.transaction_id || reg.transactionId || "FREE",
        payment_screenshot: reg.payment_screenshot || reg.paymentScreenshot || null,
      };

      try {
        const res = await fetch(`${apiUrl}/api/events/${eventId}/team-register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          const data = await res.json();
          localRegs[i].synced_to_server = true;
          if (data?.registration_id) {
            localRegs[i].registration_id = data.registration_id;
            localRegs[i].id = data.registration_id;
          }
          updated = true;
        } else if (res.status === 400) {
          // If server returns 400 (already registered), mark as synced
          localRegs[i].synced_to_server = true;
          updated = true;
        }
      } catch (err) {
        console.warn("Background sync retry pending:", err);
      }
    }

    if (updated) {
      localStorage.setItem("local_registrations", JSON.stringify(localRegs));
      window.dispatchEvent(new CustomEvent("aces_events_updated"));
    }
  } catch (e) {
    console.error("syncLocalRegistrationsToServer error:", e);
  }
}

// Auto-trigger sync on load and network online
if (typeof window !== "undefined") {
  window.addEventListener("online", syncLocalRegistrationsToServer);
  setTimeout(syncLocalRegistrationsToServer, 1000);
  setInterval(syncLocalRegistrationsToServer, 10000);
}
