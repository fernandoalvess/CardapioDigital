const menu = document.getElementById("menu")
const cartBtn = document.getElementById("cart-btn")
const cartModal = document.getElementById("cart-modal")
const cartItemsContainer = document.getElementById("cart-items")
const cartTotal = document.getElementById("cart-total")
const checkoutBtn = document.getElementById("checkout-btn")
const closeModalBtn = document.getElementById("close-modal-btn")
const cartCounter = document.getElementById("cart-count")
const addressInput = document.getElementById("address")
const addressWarn = document.getElementById("address-warn")

const navegarItems = document.querySelectorAll('.navegar a[href^="#"]');

function getScrollTopByHref(element) {
	const id = element.getAttribute('href');
	return document.querySelector(id).offsetTop;
}

function scrollToPosition(to) {
    window.scroll({
         top: to,
         behavior: "smooth",
         })
  smoothScrollTo(0, to);
}

function scrollToIdOnClick(event) {
	event.preventDefault();
	const to = getScrollTopByHref(event.currentTarget)- 25;
	scrollToPosition(to);
}

navegarItems.forEach(item => {
	item.addEventListener('click', scrollToIdOnClick);
});

let cart = [];

// Abrir o carrinho
cartBtn.addEventListener("click", function() {
    updateCartModal
    cartModal.style.display = "flex"
})

// Fechar o carrinho click fora
cartModal.addEventListener("click", function(event) {
    if(event.target === cartModal) {
        cartModal.style.display = "none"
    }
})

closeModalBtn.addEventListener("click", function() {
    cartModal.style.display = "none"
})

menu.addEventListener("click", function(event) {
    let parentButton = event.target.closest(".add-to-cart-btn")

    if(parentButton){
        const name = parentButton.getAttribute("data-name")
        const price = parseFloat(parentButton.getAttribute("data-price"))
        addToCart(name, price)
    }
})

//Função para adicionar carrinho
function addToCart(name, price){
    const existingItem = cart.find(item => item.name === name)
    
    if(existingItem){
        //Se o item existe adiciona na quantidade
        existingItem.quantity += 1;
    } else {
        cart.push({
            name,
            price,
            quantity: 1,
        })
    }

    updateCartModal()
}

//Atualiza carrinho
function updateCartModal(){
    cartItemsContainer.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        const cartItemElement = document.createElement("div");
        cartItemElement.classList.add("flex", "justify-between", "mb-4", "flex-col")

        cartItemElement.innerHTML = `
            <div class="flex items-center justify-between">
                <div>
                    <p class="font-bold">${item.name}</p>
                    <p>Qtd: ${item.quantity}</p>
                    <p class="font-medium mt-0">R$ ${item.price.toFixed(2)}</p>
                </div>

                    <button class="remove-from-cart-btn" data-name="${item.name}">
                     Remover
                    </button>

            </div>
        `
        total += item.price * item.quantity;

        cartItemsContainer.appendChild(cartItemElement)
    })

    cartTotal.textContent = total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });

    cartCounter.innerHTML = cart.length;

}

//Funçao para remover item do carrinho
cartItemsContainer.addEventListener("click", function(event) {
    if(event.target.classList.contains("remove-from-cart-btn")){
        const name = event.target.getAttribute("data-name")

        removeItemCart(name);
    }
})

function removeItemCart(name) {
    const index = cart.findIndex(item => item.name === name);

    if (index !== -1) {
        const item = cart[index];

        if (item.quantity > 1) {
            item.quantity -= 1;
            updateCartModal();
            return;
        }

        cart.splice(index, 1);
        updateCartModal();

    }
}

addressInput.addEventListener("input", function(event) {
    let inputValue = event.target.value;

    if (inputValue !== "") {
        addressInput.classList.remove("border-red-500")
        addressWarn.classList.add("hidden")
    }
})

//Finalizar carrinho
checkoutBtn.addEventListener("click", function(event) {

    const isOpen = checkOpen();
    if (!isOpen) {
        
        Toastify({
            text: "Ops o restaurante está fechado!",
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            stopOnFocus: true, // Prevents dismissing of toast on hover
            style: {
              background: "#ef4444",
            },
        }).showToast();

        return;
    }

    if(cart.length === 0) return;
    if (addressInput.value === "") {
        addressWarn.classList.remove("hidden")
        addressInput.classList.add("border-red-500")
        return;
    }

    //Enviar o pedido
    const cartItems = cart.map ((item) => {
        return (
            `- ${item.name}. *Unidades:* (${item.quantity}). *Preço:* R$${item.price.toFixed(2)}\n`
        )
    }).join("")

    const message = encodeURIComponent(cartItems)
    const phone = `88998102411`

    window.open(`https://wa.me/88998102411?text=${message} Endereço: ${addressInput.value}`, "_blank")

    cart = [];
    updateCartModal();

})
//Verificar se restaurante esta aberto
function checkOpen() {
    const data = new Date();
    const hora = data.getHours();
    return hora >= 18 && hora < 22; 
    //true = esta aberto
}

const spanItem = document.getElementById("date-spam")
const isOpen = checkOpen();

if (isOpen) {
    spanItem.classList.remove("bg-red-500")
    spanItem.classList.add("bg-green-600")
} else {
    spanItem.classList.remove("bg-green-600")
    spanItem.classList.add("bg-red-500")
}