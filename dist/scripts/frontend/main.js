import { newItem, loadItems } from './itemManager.js';
import { getPage } from './page.js';
import { init_login } from './auth.js';
import { addFriend } from './friends.js';

window.onload = () => {
    init_login();
    if (getPage() == '/') {
        const submit_newitem = document.getElementById("submit_newitem");
        submit_newitem.addEventListener("click", newItem);
        const submit_addfriend = document.getElementById("submit_addfriend");
        submit_addfriend.addEventListener("click", addFriend);
        const logout = document.getElementById("logout");
        logout.addEventListener("click", async() => {
            let res = await fetch('/api/auth/logout', {
                method: 'POST'
            });
            let data = await res.json();
            if (data.success) {
                window.location.href = '/';
            }
        });

        loadItems();
    }
}
