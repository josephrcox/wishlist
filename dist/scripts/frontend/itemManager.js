import { getPage } from "./page.js";

const itemObject = {
    name: "",
    link: "",
    id: "",
    personal: false,
    creator: "",

    display() {
        let item = document.createElement("li");
        item.id = this.id;
        item.classList.add("wishlist_item");

        let a;

        if (this.link.length > 0) {
            a = document.createElement("a");
            a.href = this.link;
        } else {
            a = document.createElement("span");
        }
        a.innerHTML = this.name;
        item.appendChild(a);

        let deleteButton = document.createElement("button");
        deleteButton.classList.add('deleteItem');
        deleteButton.innerHTML = "Delete";
        deleteButton.addEventListener("click", () => {
            this.delete();
        });
        item.appendChild(deleteButton);

        let wishlist_items;
        if (this.personal) {
            wishlist_items = document.getElementById("your_wishlist_items");
        } else {
            wishlist_items = document.getElementById(`${this.creator}_wishlist_items`);
        }
        
        wishlist_items.appendChild(item);
    }, 

    async delete() {
        let res = await fetch('/api/item/delete', {
            method: 'POST',
            body: JSON.stringify({
                item_id: this.id,
            })
        });
        let data = await res.json();
        if (data.success) {
            document.getElementById(this.id).remove();
        }
    }
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
                token: localStorage.getItem("token"),
                name: name.value,
                link: link.value
            })
        });
        const data = await response.json();
        if (data.success) {
            let item = Object.create(itemObject);
            item.name = data.item.name;
            item.link = data.item.link;
            item.id = data.item._id;
            item.personal = true;

            item.display();
            name.value = "";
            link.value = "";
        }

    }
}

export async function loadYourItems() {
    const response = await fetch("/api/items/get");
    const data = await response.json();
    if (data.success) {
        
        for (let i=0;i<data.items.length;i++) {
            var item = Object.create(itemObject);
            item.name = data.items[i].name;
            item.link = data.items[i].link;
            item.id = data.items[i]._id;
            item.personal = true;
            item.display();
        }
    }
}