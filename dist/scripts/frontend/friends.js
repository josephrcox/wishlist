export async function addFriend() {
    let friend_email = document.getElementById("friend")

    if (friend_email.value.length > 0) {
        let res = await fetch('/api/friend/add', {
            method: 'POST',
            body: JSON.stringify({
                email: friend_email.value.toLowerCase()
            })
        });
        let data = await res.json();
        if (data.success) {
            window.location.href = '/';
        } else {
            // show message for 3 seconds
            document.getElementById("friend_logs").innerHTML = data.msg;
            setTimeout(() => {
                document.getElementById("friend_logs").innerHTML = "";
            }, 3000);

            
        }
    }
}