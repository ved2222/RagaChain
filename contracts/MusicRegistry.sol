// SPDX-License-Identifier: MIT
pragma solidity 0.8.34;

contract MusicRegistry {
        
        struct Song {
        uint256 id;
        string title;
        address artist;
        string ipfsCID;
    }

    struct Contributor{
        address wallet;
        string role;
        uint256 royaltyShare;
    }

    uint256 public songCount;
    mapping(uint256 => Song) public songs;
    mapping(uint256 => Contributor[]) public contributors;
    mapping(uint256 => uint256) public totalRoyaltyShares;
    mapping(uint256 => uint256) public licensePrices;
    mapping(uint256 => mapping(address => bool)) public hasLicense;
    mapping(uint256 => bool) public isFinalized;

    event LicensePurchased(
    uint256 songId,
    address buyer,
    uint256 amount
);

    event SongFinalized(uint256 songId, address artist);
    event RoyaltyPaid(uint256 songId, address contributor, uint256 amount);

    modifier songExists(uint256 _songId) {
        require(_songId > 0 && _songId <= songCount, "Song does not exist");
        _;
    }

    modifier onlyArtist(uint256 _songId) {
        require(songs[_songId].artist == msg.sender, "Only the artist can manage this song");
        _;
    }

    modifier onlyDraft(uint256 _songId) {
        require(!isFinalized[_songId], "Song is finalized");
        _;
    }

    function registerSong(
        string memory _title,
        string memory _ipfsCID
    ) 
    public {
        songCount++;
        songs[songCount] = Song(
            songCount,
            _title,
            msg.sender,
            _ipfsCID
        );
    }

    function addContributor(
        uint256 _songId,
        address _wallet,
        string memory _role,
        uint256 _royaltyShare
    )
    public songExists(_songId) onlyArtist(_songId) onlyDraft(_songId) {
        require(
            totalRoyaltyShares[_songId] + _royaltyShare <= 100,
            "Royalty shares cannot exceed 100%"
        );
        require(_wallet != address(0), "Contributor wallet cannot be zero");
        require(bytes(_role).length > 0, "Contributor role is required");
        require(_royaltyShare > 0, "Royalty share must be greater than zero");
        contributors[_songId].push(
        Contributor(
            _wallet,
            _role,
            _royaltyShare
        )
        );
        totalRoyaltyShares[_songId] += _royaltyShare;
    }
    function setLicensePrice(
        uint256 _songId,
        uint256 _price
    )
    public songExists(_songId) onlyArtist(_songId) onlyDraft(_songId) {
        require(totalRoyaltyShares[_songId] == 100, "Royalty shares must equal 100% before pricing");
        require(_price > 0, "License price must be greater than zero");
        licensePrices[_songId] = _price;
    }

    function finalizeSong(uint256 _songId)
    public songExists(_songId) onlyArtist(_songId) onlyDraft(_songId) {
        require(totalRoyaltyShares[_songId] == 100, "Royalty shares must equal 100%");
        require(licensePrices[_songId] > 0, "License price must be set");

        isFinalized[_songId] = true;
        emit SongFinalized(_songId, msg.sender);
    }

    function purchaseLicense(
    uint256 _songId)
    public payable {

    require(_songId > 0 && _songId <= songCount, "Song does not exist");
    require(isFinalized[_songId], "Song is not finalized");
    require(!hasLicense[_songId][msg.sender], "License already purchased");

    require(
        totalRoyaltyShares[_songId] == 100,
        "Royalty shares must equal 100%"
    );

    require(
        msg.value == licensePrices[_songId],
        "Incorrect license payment"
    );

    for (
        uint256 i = 0;
        i < contributors[_songId].length;
        i++
    ) {
        Contributor memory contributor =
            contributors[_songId][i];

        uint256 royaltyAmount =
            (msg.value * contributor.royaltyShare) / 100;

        (bool success, ) =
            payable(contributor.wallet).call{
                value: royaltyAmount
            }("");

        require(
            success,
            "Royalty payment failed"
        );
        emit RoyaltyPaid(_songId, contributor.wallet, royaltyAmount);
    }
    hasLicense[_songId][msg.sender] = true;
    emit LicensePurchased(
    _songId,
    msg.sender,
    msg.value
    );
    }



    function calculateRoyalty(
        uint256 _songId,
        uint256 _amount,
        uint256 _contributorIndex
    ) public view returns (uint256) {
        Contributor memory contributor =
        contributors[_songId][_contributorIndex];
        return (_amount * contributor.royaltyShare) / 100;
    }
}
