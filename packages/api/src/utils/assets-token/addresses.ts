enum AssetId {
  BTC = 'BTC',
  ETH = 'ETH',
  USDC = 'USDC',
  UNI = 'UNI',
  DAI = 'DAI',
  sETH = 'sETH',
}

const tokensIDS = {
  [AssetId.BTC]:
    '0xccceae45a7c23dcd4024f4083e959a0686a191694e76fa4fb76c449361ca01f7',
  [AssetId.ETH]:
    '0xf8f8b6283d7fa5b672b530cbb84fcccb4ff8dc40f8176ef4544ddb1f1952ad07',
  [AssetId.USDC]:
    '0xfed3ee85624c79cb18a3a848092239f2e764ed6b0aa156ad10a18bfdbe74269f',
  [AssetId.UNI]:
    '0xb3238af388ac05188e342b1801db79d358e4a162734511316c937b00c8687fe9',
  [AssetId.DAI]:
    '0x0d9be25f6bef5c945ce44db64b33da9235fbf1a9f690298698d899ad550abae1',
  [AssetId.sETH]:
    '0x1bdeed96ee1e5eca0bd1d7eeeb51d03b0202c1faf764fec1b276ba27d5d61d89',
};

export { AssetId, tokensIDS };
