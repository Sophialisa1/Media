import Web3 from "web3";
import { newKitFromWeb3 } from "@celo/contractkit";
import BigNumber from "bignumber.js";
import erc20Abi from "../contract/erc20.abi.json";
import newsmediaAbi from "../contract/newsmedia.abi.json";

const ERC20_DECIMALS = 18;
const newsMediaContractAddress = "0x6c2d4B6232772a2e62BC2154DF3FE3cf515EE6B8";
const cUSDContractAddress = "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

let kit;
let contract;
let userWalletAddress;
let news = [];

// HEADER BUTTONS
const header = document.querySelector("header");
const navLink = document.querySelector(".navigation ul");
const headerWalletBal = document.querySelector(".user-acct-balance");
const newsContainer = document.querySelector(".news-container");
const displayedNewsContainer = document.querySelector(".news");
const headerConnectWalletBtn = document.querySelector(".header-connect-wallet");
const headerReviewNewsBtn = document.querySelector(".header-review-news-btn");
const headerUploadNewsBtn = document.querySelector(".header-upload-news-btn");
console.log (headerUploadNewsBtn)
// 4. Notification Function
const notification = (notice) => {
  const notificationText = document.querySelector(".notification h1");
  const notificationContainer = document.querySelector(".notification");
  notificationContainer.classList.replace("hide", "show");

  notificationText.textContent = notice;
};
const notificationOff = () => {
  const notificationContainer = document.querySelector(".notification");
  notificationContainer.classList.replace("show", "hide");
};
// Ends Here

// CONNECTING TO THE CELO EXTENSION WALLET
const connectToWallet = async () => {
  if (window.celo) {
    notification("Connecting to your wallet, please wait");

    try {
      await window.celo.enable();
      notification("Wallet connected");

      const web3 = new Web3(window.celo);
      kit = newKitFromWeb3(web3);

      const accounts = await kit.web3.eth.getAccounts();
      kit.defaultAccount = accounts[0];

      userWalletAddress = kit.defaultAccount;

      contract = new kit.web3.eth.Contract(
        newsmediaAbi,
        newsMediaContractAddress
      );
      notificationOff();
    } catch (error) {
      console.log(error);
    }
  } else {
    notification("Please install the CeloExtensionWallet before proceeding");
  }
  notificationOff();
};
// ENDS HERE

// 5. Get Logged In User Account Balance
const userBalance = async () => {
  const celoBalance = await kit.getTotalBalance(kit.defaultAccount); // getting the celo balance of the logged in user
  const cUSDBalance = celoBalance.cUSD.shiftedBy(-ERC20_DECIMALS).toFixed(2); // converting the celo balance to a cUSD balance to be displayed
  const displayedBalance = `
    <p>${cUSDBalance} cUSD</p>
  `;
  document.querySelector(".user-acct-balance").innerHTML = displayedBalance;
};
// Ends

headerConnectWalletBtn.addEventListener("click", async function () {
  await connectToWallet();
  await userBalance();

  headerReviewNewsBtn.classList.replace("hide", "show");
  headerUploadNewsBtn.classList.replace("hide", "show");
  headerWalletBal.classList.replace("hide", "show");

  navLink.classList.replace("show", "hide");
  headerConnectWalletBtn.classList.replace("show", "hide");
});

headerUploadNewsBtn.addEventListener("click", function () {
  uploadNewsForm.classList.replace("hide", "show");
  header.classList.replace("show-flex", "hide");
});

headerReviewNewsBtn.addEventListener("click", async function () {
  await storedNews();
  await userBalance();

  header.classList.replace("show-flex", "hide");
  articlesContainer.classList.replace("hide", "show-flex");
});
// ENDS HERE

// NEWS UPLOAD
const uploadNewsBtn = document.querySelector("#uploadNewsButton");
// const uploadNewsBtn = document.querySelector(".news-btn button");
const uploadNewsForm = document.querySelector(".user-news");

uploadNewsBtn.addEventListener("click", async function () {
  notification("Adding News, please wait");

  const newsAuthor = document.querySelector("#author").value;
  const newsTitle = document.querySelector("#title").value;
  const newsCategories = document.querySelector("#categories").value;
  const newsImage = document.querySelector("#image").value;
  const newsNewsContent = document.querySelector("#newsContent").value;
  const newsPrice = document.querySelector("#price").value;

  const news = [
    newsAuthor,
    newsTitle,
    newsCategories,
    newsImage,
    newsNewsContent,
    newsPrice,
    new BigNumber(newsPrice).shiftedBy(ERC20_DECIMALS).toString(),
  ];

  try {
    const result = await contract.methods // calling the uploadMedia function defined in the smart contract
      .uploadMedia(...news)
      .send({ from: kit.defaultAccount });

    notification(`Successfully added ${news[1]} news`);

    uploadMediaForm.classList.replace("show", "hide");
    newsContainer.classList.replace("hide", "show-flex");
  } catch (error) {
    notification(`Sorry, we were unable to add ${news[1]} news`);
  }

  uploadMedia();
  notificationOff();
});
// ENDS HERE

// REVIEW NEWS
displayedNewsContainer.addEventListener("click", async function (e) {
  // if the target element has an id
  if (e.target.className.includes("buy") && e.target.parentNode.id) {
    const newsIndex = e.target.parentNode.id; // getting the index of the news the user wants to buy when the buy button is clicked

    if (userWalletAddress === news[newsIndex].owner) {
      // if the user tries to buy his uploaded news
      notification("Sorry, you can't buy your uploaded news");
    } else {
      // when the user requests to buy another user's news
      notification(
        `Approving request to buy ${news[newsIndex].title} news, please wait`
      );

      try {
        await purchaseApproval(news[newsIndex].price); // approving the purchase request using the purchaseApproval function and passing the price
      } catch (error) {
        console.log("Error: " + error);
      }

      notification(
        `Request approved, currently purchasing ${news[newsIndex].title} news`
      );
      try {
        const result = await contract.methods // calling the buy function defined in the smart contract
          .buyNews(newsIndex)
          .send({ from: kit.defaultAccount });

        notification(`Successfully purchased ${news[newsIndex].title} news`);

        uploadMedia();
        userBalance();
        notificationOff();
      } catch (error) {
        console.log("Error " + error);
      }
    }
  }
  // if the button clicked has the delete-btn class, call the delete function
  else if (
    e.target.className.includes("delete-btn") &&
    e.target.parentNode.id
  ) {
    const newsIndex = e.target.parentNode.id;
    removeMedia(newsIndex); //  Function number 8
  }
});
// ENDS HERE

// CUSTOM FUNCTIONS

// 1. Media Template Function
const newsTemplate = (news) => {
  return `
    <div class="news-img">
      <img
        src="https://th.bing.com/th/id/R.b1c7f4a53f692a9262901fe4fab79958?rik=WiPNDSZAvEerBw&riu=http%3a%2f%2fcoachestrainingblog.com%2fbecomeacoach%2fwp-content%2fuploads%2f2015%2f09%2farticle-coaching.jpeg&ehk=WqH4cGgU7rztnypYj9kwKsZ9yTPk8yqc%2bHYlEIBBv7E%3d&risl=&pid=ImgRaw&r=0"
        alt="Image"
      />
    </div>

    <div class="article-details">
      <div class="article-author">
        <h3>
          ${news.author}
          <span class="author-wallet">${identiconTemplate(news.owner)}</span>
        </h3>
        <p>${news.title}</p>
        <p class="price">${news.price
          .shiftedBy(-ERC20_DECIMALS)
          .toFixed(2)} cUSD</p>
      </div>

      <div class="news-footer">
        <p class="purchased">Sold: ${news.purchased}</p>
        <div id=${news.index} class="buy-btns">
          ${deleteBtnDisplay(news)}
        </div>
      </div>
    </div>
  `;
};
// Ends Here

// 2. Display Available Media Function
const availableMedia = () => {
  const newsContainer = document.querySelector(".news");
  const newsContainerH1 = document.querySelector(".news-container h1");
  newsContainer.innerHTML = "";

  if (news.length < 1) {
    // if no news has been uploaded yet that is if the length property is less than 1
    newsContainerH1.innerHTML = "No News Available For Sale";
  } else {
    // if there are news in the media array that is if the length property is greater than 1
    news.forEach((news) => {
      if (!news.isDeleted) {
        const newMedia = document.createElement("div");
        newMedia.className = "news";
        newMedia.innerHTML = newsTemplate(news);

        newsContainer.appendChild(newMedia);
      }
    });
  }
};
// Ends Here

// 3. Identicon Template For News Authors
const identiconTemplate = (walletAddress) => {
  const icon = blockies
    .create({
      seed: walletAddress,
      size: 8,
      scale: 16,
    })
    .toDataURL();

  return `
    <a href="https://alfajores-blockscout.celo-testnet.org/address/${walletAddress}/transactions"
        target="_blank">
        <img src="${icon}" width="48" alt="${walletAddress}">
    </a>
  `;
};
// Ends Here

// 6. Stored Media Function
const uploadMedia = async () => {
  const newsLength = await contract.methods.getMediaLength().call(); // calling the getMediaLength function and assigning it to a variable
  const newsList = [];

  for (let i = 0; i < newsLength; i++) {
    let news = new Promise(async function (resolve, reject) {
      // creating a promise to store all news
      let savedMedia = await contract.methods.readMedia(i).call(); // calling the read news function defined in the contract and assigning it to a variable
      let isDeleted = await contract.methods.isDeleted(i).call(); //  calling the isDeleted method on the smart contract

      resolve({
        index: i,
        owner: savedMedia[0],
        author: savedMedia[1],
        title: savedMedia[2],
        categories: savedMedia[3],
        image: savedMedia[4],
        newContent: savedMedia[5],
        price: new BigNumber(savedMedia[6]),
        purchased: savedMedia[7],
        isDeleted,
      });
      reject((err) => {
        console.log("Error: " + err);
      });
    });
    newsList.push(news);
  }

  news = await Promise.all(newsList); // awaiting for all promises to be resolved before assigning all the news to the news array

  availableMedia();
};
//  Ends

// 7. Review Approval Function
const purchaseApproval = async (price) => {
  notification("Waiting for purchase approval");
  const cUSDContract = new kit.web3.eth.Contract(erc20Abi, cUSDContractAddress); //initializing a cUSD contract using the contract aUSD address

  const result = await cUSDContract.methods
    .approve(writistContractAddress, price) //approving purchase request from the initiator of the request
    .send({ from: kit.defaultAccount });

  notification("Purchase approved. Thank you for your patience.");
  return result;
};
// Ends Here

// 8. Delete Function
async function deleteMedia(index) {
  try {
    notification("Deleting this news, please wait");
    const delMedia = await contract.methods
      .deleteMedia(index)
      .send({ from: kit.defaultAccount });
    const isDel = await contract.methods.isDeleted(index).call;
    notification("Media successfully deleted");

    await uploadMedia();
    notificationOff();
  } catch (error) {
    console.log(error);
  }
}
// Ends Here
