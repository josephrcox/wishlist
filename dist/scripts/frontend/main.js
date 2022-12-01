import { newItem, loadItems } from '/dist/scripts/frontend/itemManager.js';
import { getPage } from '/dist/scripts/frontend/page.js';
import { init_login } from '/dist/scripts/frontend/auth.js';
import { addFriend } from '/dist/scripts/frontend/friends.js';
import { loadNotifications } from '/dist/scripts/frontend/notifications.js';
import { sendAnalyticalData } from "/dist/scripts/frontend/event_tracking.js";

export const qr_base = "https://chart.googleapis.com/chart?cht=qr&chs=180x180&choe=UTF-8&chl=";

export let on_specific_user_page = false;

window.onload = () => {
    console.log(window.location)
    if (window.location.search.includes("?user=")) {
        sendAnalyticalData('visit_as_guest');
        on_specific_user_page = true;
        const user = window.location.search.split("?user=")[1];
        loadItems(user);
        document.querySelector('.signup_tip').style.display = '';
    } else {
        document.querySelector('.signup_tip').style.display = 'none';
        document.querySelector('.subheader').style.display = '';
        on_specific_user_page = false;
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

}
