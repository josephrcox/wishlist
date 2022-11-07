export const notif_bell = document.getElementById("notif_bell");

export async function loadNotifications() {
    const response = await fetch("/api/notifications/get");
    const data = await response.json();
    if (data.success) {
        console.log(data.notifications);
        notif_bell.innerHTML = data.notifications.length + " notifications";
        console.log(window.location.pathname);
        if (window.location.pathname == "/notifications") {
            if (data.notifications.length === 0) {
                document.getElementById("notifications_feed").innerHTML = "No notifications, <a href='/'>go home</a>";
            } else {
                for (let i=0;i<data.notifications.length;i++) {
                    const notification = document.createElement("div");
                    notification.classList.add("notification");
                    notification.innerHTML = data.notifications[i].message;
                    let clearNotif = document.createElement("button");
                    clearNotif.innerHTML = "Clear";
                    clearNotif.addEventListener("click", async() => {
                        const resp = await fetch("/api/notifications/clear", {
                            method: "POST",
                            body: JSON.stringify({
                                message: data.notifications[i].message
                            })
                        });
                        const d = await r.json();
                        if (d.success) {
                            notification.remove();
                        }
                    });
                    clearNotif.classList.add("clearNotif");
                    notification.appendChild(clearNotif);
                    const notif_feed = document.getElementById("notifications_feed");
                    notif_feed.appendChild(notification);
                }
            }

        }
        notif_bell.addEventListener("click", () => {
            window.location.href = "/notifications";
        });

    }
}