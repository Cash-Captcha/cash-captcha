# Cash Captcha

Cash Captcha is a background captcha service that enables developers to monetize web traffic by leveraging visitors' idle computing power. Built on the Solana blockchain, it offers a unique alternative to traditional ad-based revenue models.

## Key Features

- **Unobtrusive Monetization:** Harnesses the idle computing power of your visitors’ devices without impacting their user experience or device performance. Transform your website’s traffic into a steady revenue stream without relying on traditional ads.
- **Lightweight and Efficient Algorithm:** Runs background tasks smoothly and efficiently, ensuring seamless operation on all devices.
- **Scalable Solution:** Ideal for websites of all sizes—from personal blogs to high-traffic platforms.
- **Privacy-Focused:** Operates without collecting personal data from your visitors, respecting their privacy and complying with regulations.
- **Flexible Reward System:** Choose how and when to withdraw your earnings based on your preferences.
- **Comprehensive Documentation:** Access detailed guides to assist with setup and optimization at [docs.cashcaptcha.com](https://docs.cashcaptcha.com/).
- **Developer-Friendly:** Easily extensible, allowing developers to build additional features or integrations on top of Cash Captcha for customized use cases.
- **Referral Program:** Earn additional income by referring new users to Cash Captcha.

## How It Works

Cash Captcha operates by running a lightweight proof-of-work algorithm called Drillx in the background of your website. Here's a simplified flow:

- When a user visits your site, the Cash Captcha solver initializes.
- The solver requests challenges from our API.
- It solves these challenges using the visitor's idle computing power.
- Solutions are submitted back to our API.
- Rewards are calculated based on the difficulty of submitted solutions.
- You can withdraw your earnings as SOL, USDC, or ORE tokens.

This process is designed to be unobtrusive and not affect the user's browsing experience.

## Getting Started

### Prerequisites

Before using Cash Captcha, you must obtain an API key:

- Sign up for an account at [cashcaptcha.com](https://cashcaptcha.com)
- Navigate to your dashboard to find your unique API key

⚠️ Important: An API key is required to use this package.

## Installation

You can install the Cash Captcha package using npm:

```bash
npm install cash-captcha
```

## Usage

Here's a basic example of how to use the Cash Captcha:

```javascript
import { Solver } from "cash-captcha";

// Initialize the solver with your API key
const apiKey = "your-api-key-here";
const solver = new Solver(apiKey);

// Start solving
solver.start();

// To stop solving
solver.stop();
```

## Webpack Configuration

When using Cash Captcha in a browser environment with webpack (e.g., in a Vue.js application), you may need to add some configuration to handle Node.js-specific modules. Add the following to your webpack config or `vue.config.js`:

```javascript
module.exports = {
  // ... other config
  configureWebpack: {
    resolve: {
      fallback: {
        os: false,
        fs: false,
        path: false,
        crypto: false,
      },
    },
  },
};
```

This configuration tells webpack to provide empty modules for Node.js-specific modules when building for the browser. This is necessary because Cash Captcha uses some Node.js modules for enhanced functionality in Node.js environments, but these are not needed in the browser.

Note: This configuration is typically only necessary when building browser applications with webpack. If you're using Cash Captcha in a Node.js environment or including it via a script tag in HTML, no additional configuration is needed.

## Best Practices

To optimize your use of Cash Captcha:

- Initialize the solver as early as possible in your application lifecycle.
- Use the categorizeDevicePerformance function to adjust solver behavior based on the user's device capabilities.
- For custom implementations, ensure proper error handling to gracefully manage any API communication issues.
- Consider user consent and provide an opt-out mechanism if necessary.
- Monitor your earnings and adjust your integration strategy as needed.

## Advanced Usage

### Custom Configuration

You can pass a configuration object when initializing the Solver:

```javascript
import { Solver, createConfig } from "cash-captcha";

const config = createConfig({
  apiUrl: "https://your-custom-api-url.com",
  logLevel: "info",
  maxRetries: 5,
  retryDelay: 3000,
  performanceThreshold: 2,
});

const solver = new Solver(apiKey, config);
```

### Device Performance Categorization

The package includes a utility function to categorize device performance:

```javascript
import { categorizeDevicePerformance } from "cash-captcha";

const { category, deviceInfo } = await categorizeDevicePerformance();
console.log(`Device performance category: ${category}`);
```

### Rewards

The `Rewards` class provides methods to interact with the reward system, including fetching rewards info, viewing rewards history, and claiming rewards.

#### Displaying Rewards Info

You can retrieve your rewards information (pending rewards, available rewards, and total rewards earned) using the `info()` method of the `Rewards` class.

```javascript
import { Rewards } from "cash-captcha";

const apiKey = "your-api-key-here";
const claimKey = "your-claim-key-here";
const config = { apiUrl: "https://api.cashcaptcha.com" };

const rewards = new Rewards(apiKey, claimKey, config);

async function fetchRewardsInfo() {
  const info = await rewards.info();
  console.log("Rewards Info:", info);
}

fetchRewardsInfo();
```

**Response:**

```json
{
  "rewardsPending": 192249,
  "rewardsAvailable": 35264,
  "rewardsEarned": 227513,
  "rewardsClaimed": 0
}
```

#### Viewing Rewards History

You can also retrieve the rewards history for a specific epoch using the `history()` method. This returns details such as pool rewards, cumulative difficulty, and the best solution difficulty.

```javascript
async function fetchRewardsHistory(epoch, page = 0, itemsPerPage = 10) {
  const history = await rewards.history(epoch, page, itemsPerPage);
  console.log("Rewards History:", history);
}

fetchRewardsHistory(8); // Example: Fetch history for epoch 8
```

**Response:**

```json
{
  "results": [
    {
      "pool": "group_2",
      "pool_best_solution_difficulty": 11,
      "pool_rewards_earned": 928,
      "user_rewards_earned": 743,
      "submission_time": "2024-10-01T13:05:00Z"
    },
    ...
  ],
  "total": 409
}
```

#### Claiming Rewards

To claim rewards, use the `claim()` method. You need to provide the amount of ORE to claim, the withdrawal token (SOL, USDC, or ORE), and the withdrawal address.

Make sure you have generated a claim key in your account settings on the [Cash Captcha website](https://cashcaptcha.com).

```javascript
async function claimRewards(amount, withdrawalToken, withdrawalAddress) {
  const result = await rewards.claim(
    amount,
    withdrawalToken,
    withdrawalAddress
  );
  console.log("Claim Result:", result);
}

claimRewards(10000000, "SOL", "your-wallet-address-here"); // Example: Claim 0.0001 ORE and swap it to SOL at the current market rate
```

**Response:**

```json
{
  "status": "inProgress"
}
```

### Registering Users

Developers can register new users under their account, which allows you to credit the rewards earned by your users directly to them. Use the `Register` class to handle the registration process.

```javascript
import { Register } from "cash-captcha";

const apiKey = "your-api-key-here";
const claimKey = "your-claim-key-here";
const config = { apiUrl: "https://api.cashcaptcha.com" };

const register = new Register(apiKey, claimKey, config);

async function registerNewUser(email, referredBy = "") {
  const result = await register.registerUser(email, referredBy);
  console.log("New User Registered:", result);
}

registerNewUser("user@example.com", "your-referral-code"); // Example: Register a new user
```

**Response:**

```json
{
  "email": "user@example.com",
  "apiKey": "generated-user-api-key"
}
```

#### Generating a Claim Key for a New User

Once a user is registered, you can generate a new claim key for them. This allows the user to claim their rewards independently.

```javascript
async function generateClaimKeyForUser(userApiKey) {
  const result = await register.resetClaimKey(userApiKey);
  console.log("New Claim Key Generated:", result.newClaimKey);
}

generateClaimKeyForUser("new-user-api-key"); // Example: Generate a claim key for the new user
```

**Response:**

```json
{
  "newClaimKey": "generated-claim-key"
}
```

## Compatibility

Cash Captcha is compatible with:

- Node.js 12.x and above
- Modern browsers (Chrome, Firefox, Safari, Edge)
- React, Vue, Svelte, and other popular frontend frameworks

## Troubleshooting

Common issues and their solutions:

- API Key Invalid: Ensure you've correctly copied your API key from the Cash Captcha dashboard.
- No Solutions Found: Check your network connection and firewall settings.
- Performance Issues: Use the categorizeDevicePerformance function to adjust settings for lower-end devices.

For more help, visit https://cashcaptcha.com/support

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
