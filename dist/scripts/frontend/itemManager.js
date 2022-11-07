import { getPage } from "./page.js";
import { qr_base } from "./main.js";

export let WISHLISTS = [];

const listObject = {
    title:"",
    personal:false,
    user_id:"",

    display() {
        let wishlist = document.createElement('div');
        wishlist.classList.add('wishlist_block');
        wishlist.id = this.user_id;

        let wishlist_title = document.createElement('h2');
        wishlist_title.innerHTML = this.title;
        wishlist.appendChild(wishlist_title);
        if (this.personal) {
            wishlist_title.innerHTML += " (you)";
        } else {
            let wishlist_delete = document.createElement('button');
            wishlist_delete.innerHTML = "(-)";
            wishlist_delete.classList.add('wishlist_delete');
            wishlist_delete.addEventListener('click', async() => {
                let res = await fetch('/api/friend/remove', {
                    method: 'POST',
                    body: JSON.stringify({
                        id: this.user_id
                    })
                });
                let data = await res.json();
                if (data.success) {
                    document.getElementById(this.user_id).remove();
                }
            });
            wishlist_title.appendChild(wishlist_delete);
        }


        let wishlist_items = document.createElement('ul');
        wishlist_items.id = `${this.title}_wishlist_items`;
        wishlist.appendChild(wishlist_items);

        document.getElementById("wishlist_grid").appendChild(wishlist);
    },

    addItem(item) {
        console.log(item)
        let wishlist_items = document.getElementById(`${this.title}_wishlist_items`);
        let wishlist_item = document.createElement('li');
        wishlist_item.classList.add('wishlist_item');
        wishlist_item.id = item._id+"_wishlist_item";
        console.log(item.link)
        if (item.link) {
            wishlist_item.innerHTML = `<a href="${item.link}">${item.name}</a>`;
        } else {
            wishlist_item.innerHTML = item.name;
        }

        if (this.personal) {
            let deleteButton = document.createElement("button");
            deleteButton.classList.add('deleteItem');
            deleteButton.innerHTML = "Delete";
            deleteButton.addEventListener("click", async() => {
                const popup = document.getElementById("popup");
                let poptitle = popup.children[0]
                let popbody = popup.children[1]
                let popclose = popup.children[2]
                let popinput = popup.children[3]
                let popsubmit = popup.children[4]

                poptitle.innerHTML = "Are you sure you want to delete this item?";
                popbody.innerHTML = "This action cannot be undone, and it may have already been purchased.<br/><br/>In case someone has already purchased this for you, please leave a message for them.";
                popinput.style.display = "block";
                popup.classList.toggle("hidden")
                popinput.placeholder = "I bought this for myself during Black Friday..."
                popsubmit.addEventListener("click", async() => {
                    let res = await fetch('/api/item/delete', {
                        method: 'POST',
                        body: JSON.stringify({
                            item_id: item._id,
                            message: popinput.value
                        })
                    });
                    let data = await res.json();
                    if (data.success) {
                        document.getElementById(`${item._id}_wishlist_item`).remove();
                    } else {
                        console.log("Error deleting item");
                    }
                });

                popclose.addEventListener("click", () => {
                    popup.classList.add("hidden");
                });

                
            });
            wishlist_item.appendChild(deleteButton);
        } else {
            // if item is not personal, add a button to purchase it
            let purchaseButton = document.createElement("button");
            purchaseButton.classList.add('purchaseItem');
            wishlist_item.appendChild(purchaseButton);
            if (item.purchased_by.length > 0) {
                purchaseButton.innerHTML = "Purchased";
                wishlist_item.classList.add('strikethrough')
                purchaseButton.disabled = true;
            } else {
                purchaseButton.innerHTML = "Mark as purchased";
                purchaseButton.addEventListener("click", async() => {
                    let res = await fetch('/api/item/purchase', {
                        method: 'POST',
                        body: JSON.stringify({
                            item_id: item._id,
                            user_id: this.user_id
                        })
                    });
                    let data = await res.json();
                    if (data.success) {
                        purchaseButton.innerHTML = "Purchased!";
                    } else {
                        console.log("Error purchasing item");
                    }
                });
            }
        }
    

        wishlist_items.appendChild(wishlist_item);

    }, 
}

export async function newItem() {
    const name = document.getElementById("name");
    const link = document.getElementById("link"); 
    if (getPage() === "/") {
        // on main home page, proceed
        const response = await fetch("/api/item/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: name.value,
                link: link.value
            })
        });
        const data = await response.json();
        console.log(data);
        if (data.success) {
            for (let i=0;i<WISHLISTS.length;i++) {
                if (WISHLISTS[i].personal) {
                    WISHLISTS[i].addItem(data.item);
                    
                } else {
                    console.log(WISHLISTS[i].title);
                }
            }
        }

    }
}

export async function loadItems() {
    const response = await fetch("/api/items/get");
    const data = await response.json();
    if (data.success) {
        document.getElementById('friend_form_tooltip').innerHTML = `Your email is ${data.your_email}`;
        document.getElementById('qr').src = qr_base + window.location.href + "add_friend/" + data.your_email;
        localStorage.setItem("email", data.your_email);
        for (let i = 0; i < data.items.length; i++) {
            let list = Object.create(listObject);
            WISHLISTS.push(list);
            list.items = data.items[i][1];
            list.title = data.items[i][0];
            list.personal = data.items[i][2];
            list.user_id = data.items[i][3];
            list.display();
            for (let x=0;x<data.items[i][1].length;x++) {
                list.addItem(data.items[i][1][x]);
            }
        
        }


    }
}