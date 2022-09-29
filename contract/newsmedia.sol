// SPDX-License-Identifier: MIT

pragma solidity >=0.7.0 <0.9.0;

interface IERC20Token {
  function transfer(address, uint256) external returns (bool);
  function approve(address, uint256) external returns (bool);
  function transferFrom(address, address, uint256) external returns (bool);
  function totalSupply() external view returns (uint256);
  function balanceOf(address) external view returns (uint256);
  function allowance(address, address) external view returns (uint256);

  event Transfer(address indexed from, address indexed to, uint256 value);
  event Approval(address indexed owner, address indexed spender, uint256 value);
}

contract Newsmedia {

    uint internal newsLength = 0;
    address internal cUsdTokenAddress = 0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1;


    struct Media {
        address payable owner;
        string author;
        string title;
        string categories;
        string image;
        string newsContent;
        uint price;
        uint sold;
    }

    mapping (uint => Media) internal news;

        modifier onlyOwner(uint _index) {
        require(msg.sender == news[_index].owner, "Only Owner");
        _;
    }


//carring out the function will add a new media to the mapping
    function uploadMedia(
        string memory _author,
        string memory _title,
        string memory _categories,
        string memory _image,
        string memory _newsContent,  
        uint _price
    ) public {
        uint _sold = 0;
        news[newsLength] = Media(
            payable(msg.sender),
            _author,
            _title,
            _categories,
            _image,
            _newsContent,
            _price,
            _sold
        );
        newsLength++;
    }

//acquire a Ticket from 
    function getMedia(uint _index) public view returns (
        address payable,
        string memory, 
        string memory,  
        string memory,
        string memory,
        string memory,
        uint,
        uint
    ) {
        Media memory n = news[_index];
        return (

            n.owner,
            n.author, 
            n.title,
            n.categories,
            n.image,
            n.newsContent, 
            n.price,
            n.sold
           
        );
    }



// remove news from catalog
    function removeMedia(uint _index) external {
	        require(msg.sender == news[_index].owner, "Only the owner can remove the news");         
            news[_index] = news[newsLength - 1];
            delete news[newsLength - 1];
            newsLength--; 
	 }

    function updateMedia(uint _index) public {
            require(msg.sender == news[_index].owner, "Invalid owner");
            news[_index] = news[newsLength - 1];
    }


    function editMedia(uint _index) public {
        require(msg.sender == news[_index].owner, "Invalid owner");
        news[_index] = news[newsLength - 1];
    }

    function buyNews(uint _index) public payable  {
        require(
          IERC20Token(cUsdTokenAddress).transferFrom(
            msg.sender,
            news[_index].owner,
            news[_index].price
          ),
          "Transfer failed."
        );
        news[_index].sold++;
    }

    
    function getMediaLength() public view returns (uint) {
        return (newsLength);
    }
    }