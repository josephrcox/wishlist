import { getPage } from "./page.js";

export let token;
export let isAuthenticated;

export function init_login() {
    if (getPage() == '/login') {
        const submit_login = document.getElementById('submit_login');
        const name = document.getElementById('name');
        const email = document.getElementById('email');
        
        submit_login.addEventListener('click', async() => {
            if (name.value && email.value) {
                let res = await fetch('/api/auth/login', {
                    method: 'POST',
                    body: JSON.stringify({
                        name: name.value,
                        email: email.value
                    })
                });
                let data = await res.json();
                console.log(data.success)
                if (data.success) {
                    isAuthenticated = true;
                    localStorage.setItem('token', data.token);
                    window.location.href = '/';
                } else {
                    isAuthenticated = false;
                }
            }
        });
        
    }
    
}
