# System Setup 🚀

Follow these steps to set up and run the project on your local machine:

## Prerequisites
- **Git**: [Download Git](https://git-scm.com/) (required for cloning the repository)
- **Node.js** (v14 or higher): [Download Node.js](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Expo CLI** (optional, for global usage):
  ```bash
  npm install -g expo-cli
  ```

# Expo Build Setup

To create production builds for Android , use Expo Application Services (EAS):

1. **Install EAS CLI** (if you haven't already):
   ```bash
   npm install -g eas-cli
   ```
2. **Log in to Expo**:
   ```bash
   eas login
   ```
   - If you need to switch accounts, first log out:
     ```bash
     eas logout
     ```
   - Then log in with the new Expo account:
     ```bash
     eas login
     ```
   - You can check the current account with:
     ```bash
     eas whoami
     ```
   > **Note:** You can only be logged in to one Expo account at a time per terminal session.
3. **Configure your project** (if not already):
   ```bash
   eas build:configure
   ```
4. **Build for Android**:
   ```bash
   eas build -p android
   ```

For more details, see the [Expo EAS Build documentation](https://docs.expo.dev/build/introduction/).

## Installation & Running
1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <your-repo-url>
   cd <your-project-folder>
   ```
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Start the app**:
   ```bash
   npx expo start
   ```
   This will open the Expo Dev Tools in your browser, where you can run the app on an emulator, simulator, or your physical device using the QR code.

---

# Project Structure

- **src/** – Main source code for the app (components, screens, hooks, styles, etc.)
- **assets/** – Images, icons, and static assets
- **data/** – Static data and configuration files
- **scripts/** – Utility scripts (e.g., project reset)
- **App.js** – Entry point for the app

# Available Scripts

- `npm start` or `npx expo start` – Start the Expo development server
- `npm run reset-project` – Reset to a fresh project state (see below)

# Development Tips

- Use the Expo Go app or an emulator/simulator to preview your app.
- Press `r` in the terminal to reload the app.
- Press `d` to open the developer menu.
- For debugging, use [React Native Debugger](https://github.com/jhen0409/react-native-debugger) or Chrome DevTools.

# Troubleshooting

- **Metro bundler not starting?** Try `npx expo start -c` to clear the cache.
- **Dependency issues?** Delete `node_modules` and `package-lock.json`, then run `npm install` again.
- **Expo Go not connecting?** Make sure your device and computer are on the same Wi-Fi network.

# Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -am 'Add new feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **src** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
