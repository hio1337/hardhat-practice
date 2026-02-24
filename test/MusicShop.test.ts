import {
  expect,
  hre,
  type NetworkHelpers,
  type HardhatEthers,
} from "./setup.js";

describe("MusicShop", () => {
  let ethers: HardhatEthers;
  let networkHelpers: NetworkHelpers;

  before(async () => {
    const connection = await hre.network.connect();

    ({ ethers, networkHelpers } = connection);
  });

  async function deploy() {
    const [owner, buyer] = await ethers.getSigners();

    const MusicShop = await ethers.getContractFactory("MusicShop");

    const shop = await MusicShop.deploy(owner.address);

    await shop.waitForDeployment();

    return { shop, owner, buyer };
  }

  it("should allow to add albums", async () => {
    const { shop } = await networkHelpers.loadFixture(deploy);

    const title = "Demo";
    const price = 100;
    const uid = ethers.solidityPackedKeccak256(["string"], [title]);
    const quantity = 5;
    const initialIndex = 0;

    const addTx = await shop.addAlbum(uid, title, price, quantity);
    await addTx.wait();

    const album = await shop.albums(initialIndex);

    expect(album.index).to.eq(initialIndex);
    expect(album.uid).to.eq(uid);
    expect(album.title).to.eq(title);
    expect(album.price).to.eq(price);
    expect(album.quantity).to.eq(quantity);

    expect(await shop.currentIndex()).to.eq(initialIndex + 1);
  });

  it("should allow to buy", async () => {
    const { shop, buyer } = await networkHelpers.loadFixture(deploy);

    const title = "Demo";
    const price = 100;
    const uid = ethers.solidityPackedKeccak256(["string"], [title]);
    const quantity = 5;
    const albumIdxToBuy = 0;
    const initialOrderId = 0;

    expect(await shop.currentOrderId()).to.eq(initialOrderId);

    const addTx = await shop.addAlbum(uid, title, price, quantity);
    await addTx.wait();

    const album = await shop.albums(albumIdxToBuy);

    const buyTx = await shop
      .connect(buyer)
      .buy(albumIdxToBuy, { value: price });
    const receipt = await buyTx.wait();

    await expect(buyTx).to.changeEtherBalances(
      ethers,
      [shop, buyer],
      [price, -price],
    );

    expect(receipt).to.be.not.undefined;
    const block = await ethers.provider.getBlock(receipt!.blockNumber);

    const expectedTs = block?.timestamp;

    await expect(buyTx)
      .to.emit(shop, "AlbumBought")
      .withArgs(uid, buyer.address, expectedTs);

    expect(await shop.currentOrderId()).to.eq(initialOrderId + 1);

    const order = await shop.orders(initialOrderId);

    expect(order.orderId).to.eq(initialOrderId);
    expect(order.albumUid).to.eq(uid);
    expect(order.customer).to.eq(buyer.address);
    expect(order.orderedAt).to.eq(expectedTs);
    expect(order.status).to.eq(0);

    expect((await shop.albums(albumIdxToBuy)).quantity).to.eq(
      album.quantity - 1n,
    );
  });

  it("should not allow to buy via receive", async () => {
    const { shop, buyer } = await networkHelpers.loadFixture(deploy);

    const txData = {
      to: shop.target,
      value: 100,
    };

    await expect(buyer.sendTransaction(txData)).to.be.revertedWith(
      "Please use the buy function to purchase albums!",
    );
  });

  it("should allow to trigger delivery", async () => {
    const { shop, buyer } = await networkHelpers.loadFixture(deploy);

    const title = "Demo";
    const price = 100;
    const uid = ethers.solidityPackedKeccak256(["string"], [title]);
    const quantity = 5;
    const albumIdxToBuy = 0;
    const orderId = 0;

    expect(await shop.currentOrderId()).to.eq(orderId);

    const addTx = await shop.addAlbum(uid, title, price, quantity);
    await addTx.wait();

    const album = await shop.albums(albumIdxToBuy);

    const buyTx = await shop
      .connect(buyer)
      .buy(albumIdxToBuy, { value: price });
    await buyTx.wait();

    const triggerDeliveryTx = await shop.delivered(albumIdxToBuy);
    await triggerDeliveryTx.wait();

    const order = await shop.orders(orderId);
    expect(order.status).to.eq(1);

    await expect(triggerDeliveryTx)
      .to.emit(shop, "OrderDelivered")
      .withArgs(uid, buyer.address);
  });
});
