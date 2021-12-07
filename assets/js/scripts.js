const shoppingCart = document.querySelector(".shopping-cart");
const shoppingCartBtn = shoppingCart.querySelector(".shopping-cart-btn");
const shoppingCartMenu = shoppingCart.querySelector(".shopping-cart-menu");
const shoppingCartItems = shoppingCartMenu.querySelector(".cart-list");
const shoppingCartIsEmpty = shoppingCart.querySelector(".empty-cart");
const checkOutBtn = shoppingCart.querySelector(".checkout");
const preloader = document.querySelector(".preloader");

let products = [];

class UI {
  static displayProducts() {
    const productList = document.querySelector(".products");

    fetch("https://fakestoreapi.com/products")
      .then((res) => res.json())
      .then((data) => {
        products = data;

        products.forEach((product) => {
          productList.innerHTML += UI.createProductHtml(product);
        });
      })
      .finally(() => {
        preloader.classList.add("d-none");
      });
  }

  static displayCartItems() {
    const cartItems = CartStorage.getCartItems();

    UI.displayCartTotal();
    UI.displayCartItemsCount();

    shoppingCartItems.innerHTML = "";
    cartItems.forEach((cartProduct) => {
      shoppingCartItems.innerHTML += UI.createCartItemHtml(cartProduct);
    });
  }

  static storeCartItem(productId) {
    CartStorage.addProductToCart(productId);
    UI.displayCartItems();
  }

  static deleteCartItem(el) {
    const cartProductDetail = el.parentElement.parentElement.parentElement;
    const productId = +cartProductDetail.getAttribute("data-product-id");
    const deletedItem = CartStorage.deleteProductFromCart(productId);

    if (deletedItem != -1) {
      cartProductDetail.remove();
      UI.displayCartTotal();
      UI.displayCartItemsCount();
    }
  }

  static updateProductQuantity(el, type) {
    const cartProductDetail =
      el.parentElement.parentElement.parentElement.parentElement;
    const productId = +cartProductDetail.getAttribute("data-product-id");

    const counterInput =
      el.parentElement.parentElement.querySelector(".input-number");

    switch (type) {
      case "plus":
        counterInput.value = +counterInput.value + 1;
        break;

      case "minus":
        if (+counterInput.value > 1) {
          counterInput.value = +counterInput.value - 1;
        }

        break;
    }

    CartStorage.updateCartQuantity(productId, +counterInput.value);
    UI.displayCartTotal();
  }

  static displayCartItemsCount() {
    const itemCount = CartStorage.getCartItems().length;

    if (itemCount > 3) {
      shoppingCartMenu.style.height = "450px";
    } else {
      shoppingCartMenu.style.height = "";
    }

    UI.displayCartIsEmpty();

    shoppingCart.querySelectorAll(".cart-counter").forEach((counter) => {
      counter.innerText = itemCount;
    });
  }

  static displayCartIsEmpty() {
    const productCount = CartStorage.getCartItems().length;

    if (productCount < 1) {
      shoppingCartIsEmpty.classList.remove("d-none");
      checkOutBtn.classList.add("d-none");
    } else {
      checkOutBtn.classList.remove("d-none");
      shoppingCartIsEmpty.classList.add("d-none");
    }
  }

  static displayCartTotal() {
    const cartItems = CartStorage.getCartItems();

    const cartTotal = cartItems.reduce(
      (total, product) => total + product.price * product.quantity,
      0
    );

    shoppingCartMenu.querySelector(
      ".cart-total"
    ).innerText = `$${cartTotal.toFixed(2)}`;
  }

  static createCartItemHtml(cartProduct) {
    return `
      <div class="row cart-detail" data-product-id="${cartProduct.id}">
        <div class="col-lg-4 col-sm-4 col-4 cart-detail-img">
            <img src="${cartProduct.image}">
        </div>
        <div class="col-lg-8 col-sm-8 col-8 cart-detail-product">
            <div class="d-flex justify-content-between align-items-baseline">
                <p>${cartProduct.title}</p>
                <a href="#" class="badge badge-danger" 
                  title="Remove" 
                  onclick="UI.deleteCartItem(this)">
                    <i class="fa fa-trash"></i>
                </a>
            </div>
            <span class="price text-info">
                $${cartProduct.price}
            </span>
            <div class="input-group mt-1">
                <span class="input-group-prepend">
                    <button type="button" class="btn btn-sm btn-danger btn-number"
                        onclick="UI.updateProductQuantity(this, 'minus')">
                        <span class="fa fa-minus"></span>
                    </button>
                </span>
                <input type="number"
                    class="form-control shadow-none btn-sm input-number" readonly value="${cartProduct.quantity}" min="1"
                    max="10">
                <span class="input-group-append">
                    <button type="button" class="btn btn-sm btn-success btn-number"
                        onclick="UI.updateProductQuantity(this, 'plus')">
                        <span class="fa fa-plus"></span>
                    </button>
                </span>
            </div>
        </div>
    </div>
    `;
  }

  static createProductHtml(product) {
    return `
          <div class="col-lg-3 col-md-6 mb-4">
              <div class="card h-100 shadow">
                  <a href="#" class="text-center card-image">
                      <img class="card-img-top" src="${
                        product.image
                      }" alt="..." />
                  </a>
                  <div class="card-body">
                      <h4 class="card-title">
                          <a href="#">${product.title}</a>
                      </h4>
                      <div class="d-flex align-items-baseline">
                        <div class="rating">
                            ${UI.createProductRatingHtml(product.rating.rate)}
                        </div>
                        <small class="text-secondary ml-2">(${
                          product.rating.count
                        })</small>
                      </div>
                      <h5 class="font-weight-bold">$${product.price}</h5>
                      <p class="card-text">
                          ${product.description.substring(0, 64)} ...
                      </p>
                  </div>
                  <div class="card-footer">
                      <button 
                          class="btn btn-outline-primary w-100 add-to-cart" 
                          onclick="UI.storeCartItem(${product.id})">
                          <i class="fas fa-cart-plus"></i>
                          Add to cart
                      </button>
                  </div>
              </div>
          </div>
      `;
  }

  static createProductRatingHtml(rate) {
    let productRatingHTML = "";
    let currentRating = Math.round(rate);

    for (let rating = 1; rating <= 5; rating++) {
      if (currentRating >= rating) {
        productRatingHTML += `<i class="fa fa-star text-warning"></i>`;
      } else {
        productRatingHTML += `<i class="fa fa-star"></i>`;
      }
    }

    return productRatingHTML;
  }
}

class CartStorage {
  static getCartItems() {
    return JSON.parse(localStorage.getItem("cartItems") || "[]");
  }

  static addProductToCart(productId) {
    const cartItems = CartStorage.getCartItems();

    const cartItemIndex = cartItems.findIndex(
      (product) => product.id == productId
    );

    if (cartItemIndex != -1) {
      cartItems[cartItemIndex].quantity += 1;
    } else {
      const product = products.find((product) => product.id == productId);

      cartItems.push({
        ...product,
        quantity: 1,
      });
    }

    CartStorage.setCartItems(cartItems);
  }

  static updateCartQuantity(productId, quantity) {
    const cartItems = CartStorage.getCartItems();
    const cartItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.id == productId
    );

    if (cartItemIndex != -1) {
      cartItems[cartItemIndex].quantity = quantity;
      CartStorage.setCartItems(cartItems);
    }

    return cartItemIndex;
  }

  static deleteProductFromCart(productId) {
    const cartItems = CartStorage.getCartItems();
    const cartItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.id == productId
    );

    if (cartItemIndex != -1) {
      cartItems.splice(cartItemIndex, 1);
      CartStorage.setCartItems(cartItems);
    }

    return cartItemIndex;
  }

  static setCartItems(products) {
    localStorage.setItem("cartItems", JSON.stringify(products));
  }
}

document.addEventListener("DOMContentLoaded", () => {
  // fetch all products
  UI.displayProducts();

  // get all cart items
  UI.displayCartItems();
});

// toggle shopping cart menu
shoppingCartBtn.addEventListener("click", () =>
  shoppingCartMenu.classList.toggle("show")
);
