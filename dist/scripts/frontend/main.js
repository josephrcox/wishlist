import { newItem, loadYourItems } from './itemManager.js';
import { getPage } from './page.js';
import { init_login } from './auth.js';

window.onload = () => {
    init_login();
    if (getPage() == '/') {
        const submit_newitem = document.getElementById("submit_newitem");
        submit_newitem.addEventListener("click", newItem);
        loadYourItems();
    }
}
