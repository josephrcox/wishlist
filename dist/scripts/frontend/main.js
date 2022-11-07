import { newItem, loadItems } from './itemManager.js';
import { getPage } from './page.js';
import { init_login } from './auth.js';
import { addFriend } from './friends.js';
import { loadNotifications } from './notifications.js';

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
