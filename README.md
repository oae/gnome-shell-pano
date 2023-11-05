# <img width="32px" src="./io.elhan.Pano.svg" alt="Pano" /> Pano - Next-gen Clipboard Manager

[![ts](https://badgen.net/badge/icon/typescript?icon=typescript&label)](#)
[![opensource](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](#)
[![licence](https://badges.frapsoft.com/os/gpl/gpl.png?v=103)](https://github.com/oae/gnome-shell-pano/blob/master/LICENSE)
[![latest](https://img.shields.io/github/v/release/oae/gnome-shell-pano)](https://github.com/oae/gnome-shell-pano/releases/latest)
[![compare](https://img.shields.io/github/commits-since/oae/gnome-shell-pano/latest/master)](https://github.com/oae/gnome-shell-pano/compare)

![ss](https://i.imgur.com/k8owX1i.png)

## Features

- ⌨️ Keyboard-driven navigation. See [Navigation](#navigation)
- 🧠 Content aware previews and notifications (Image, Link, Text, Code, Color, Emoji, File). See [Notifications](#content-aware-notifications)
- 🎨 Highly customizable UI with slick design. See [Customization](#settings)
- ⭐ Favorite any items and access them easily. See [Favorites](#favorites)
- ⚙️ And many more options for different needs. See [Settings](#settings)

## Settings

<table width="100%">
  <thead>
    <tr>
      <th width="33%">General Options</th>
      <th width="33%">Customization</th>
      <th width="33%">Danger Zone</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="33%"><img alt="General Options" src="https://i.imgur.com/Mc6yXsA.png" /></td>
      <td width="33%"><img alt="Customization" src="https://i.imgur.com/aZjfT7e.png" /></td>
      <td width="33%"><img alt="Danger Zone" src="https://i.imgur.com/RlM1AgI.png" /></td>
    </tr>
  </tbody>
</table>

## Favorites

[Favorites](https://user-images.githubusercontent.com/1043714/222934867-d8fb1c2c-81a2-46c6-a8b0-f0be96850d2f.webm)

## Content Aware Notifications

<table width="100%">
  <thead>
    <tr>
      <th width="33%">Item Type</th>
      <th width="80%">Notification</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td width="33%">Link</td>
      <td width="80%"><img alt="Link" src="https://i.imgur.com/XnIK7JT.png" /></td>
    </tr>
    <tr>
      <td width="33%">Image</td>
      <td width="80%"><img alt="Image" src="https://i.imgur.com/amHhZyI.png" /></td>
    </tr>
    <tr>
      <td width="33%">Color</td>
      <td width="80%"><img alt="Color" src="https://i.imgur.com/Qk6bFFM.png" /></td>
    </tr>
    <tr>
      <td width="33%">Emoji</td>
      <td width="80%"><img alt="Emoji" src="https://i.imgur.com/7iNLUpb.png" /></td>
    </tr>
    <tr>
      <td width="33%">Text,Code</td>
      <td width="80%"><img alt="Text" src="https://i.imgur.com/hDv8Fgp.png" /></td>
    </tr>
    <tr>
      <td width="33%">File Cut/Copy</td>
      <td width="80%">
        <img alt="File Copy" src="https://i.imgur.com/Wmiay4o.png" />
        <img alt="File Cut" src="https://i.imgur.com/L77dpS9.png" />
      </td>
    </tr>
  </tbody>
</table>

## Supported Shell Versions


### Legacy versions

Since Gnome 45 we had to break compatibility with previous Gnome versions, these only receive critical bug / security fixes and ar not maintained actively

- Gnome Shell 42
- Gnome Shell 43
- Gnome Shell 44

### Current version

- Gnome Shell 45


## Installation

- You need `libgda` and `gsound` for this extension to work.
- We support both libgda 5.0 and 6.0

  - Fedora

    ```bash
    sudo dnf install libgda libgda-sqlite
    ```

  - Arch Linux (For gnome-43 or later, you need libgda6)

    ```bash
    sudo pacman -S libgda
    ```

  - Ubuntu/Debian

    ```bash
    sudo apt install gir1.2-gda-5.0 gir1.2-gsound-1.0
    ```

  - openSUSE

    ```bash
    sudo zypper install libgda-6_0-sqlite typelib-1_0-Gda-6_0 typelib-1_0-GSound-1_0
    ```

- You can install the extension from EGO

  [<img height="100" src="https://github.com/andyholmes/gnome-shell-extensions-badge/raw/master/get-it-on-ego.png">](https://extensions.gnome.org/extension/5278/pano/)

## Usage

### Navigation

[Navigation](https://user-images.githubusercontent.com/1043714/222934876-2e922f6c-36db-456b-826b-3b129da540b4.webm)

- `<super>` `<shift>` `v` can be use to toggle visibility of the Pano. This can be changed in Pano extension settings.
- `<ctrl>` `<super>` `<shift>` `v` can be use to toggle incognito mode.
- `left` and `right` arrow keys can be used for navigating between items. Pressing `left` key on the first item will focus search box. Also pressing `right` key will go to first/last focused item on the list.
- `up` and `down` keys can also be use to focus on search box and items
- `enter` key or clicking to an item will copy it. You can hold `shift` key for the apps like terminal to paste into it
- Typing anywhere on Pano will focus on search box and filter the results.
- `delete` key will remove the focused item from the list.
- `tab` key will cycle through item types (like `image`, `link` etc..) `shift` `tab` will reverse the direction
- `backspace` key on empty search box will remove item type filter
- `ctrl` `s` key will favorite/unfavorite the item
- `alt` key will switch between favorites/all items
- `ctrl` `1`..`9` keys will copy the item with the corresponding index
- `ctrl` `click` or `ctrl` `enter` shortcuts will copy the links and open them in default browser if `Open Links in Browser` option enabled

## Cli

You can trigger several actions using busctl.

```sh
busctl --user call org.gnome.Shell /io/elhan/Pano io.elhan.Pano clearHistory # clears pano history
busctl --user call org.gnome.Shell /io/elhan/Pano io.elhan.Pano toggle # toggles pano window
busctl --user call org.gnome.Shell /io/elhan/Pano io.elhan.Pano hide # hides pano window
busctl --user call org.gnome.Shell /io/elhan/Pano io.elhan.Pano show # shows pano window
```

## Development

### Dependencies

- Fedora: `sudo dnf install cogl-devel gsound-devel libgda-devel`

### Build

- This extension is written in Typescript and uses rollup to compile it into javascript.
- To start development, install `nodejs`  on your system.

  - Clone the project

    ```sh
    git clone https://github.com/oae/gnome-shell-pano.git
    cd ./gnome-shell-pano
    ```

  - Install dependencies and build it

    ```sh
    yarn install
    yarn build
    ln -s "$PWD/dist" "$HOME/.local/share/gnome-shell/extensions/pano@elhan.io"
    ```

  - During development you can use `yarn watch` command to keep generated code up-to-date.
