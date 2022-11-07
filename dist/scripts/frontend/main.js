import { newItem, loadItems } from '/dist/scripts/frontend/itemManager.js';
import { getPage } from '/dist/scripts/frontend/page.js';
import { init_login } from '/dist/scripts/frontend/auth.js';
import { addFriend } from '/dist/scripts/frontend/friends.js';
import { loadNotifications } from '/dist/scripts/frontend/notifications.js';

export const qr_base = "https://chart.googleapis.com/chart?cht=qr&chs=180x180&choe=UTF-8&chl=";

window.onload = () => {
    console.log("window loaded")
    init_login();
    if (getPage() == '/') {
        const submit_newitem = document.getElementById("submit_newitem");
        submit_newitem.addEventListener("click", newItem);
        const submit_addfriend = document.getElementById("submit_addfriend");
        submit_addfriend.addEventListener("click", addFriend);

        loadItems();
    }
    loadNotifications();
}
