# Pano - Next-gen Clipboard Manager

[![ts](https://badgen.net/badge/icon/typescript?icon=typescript&label)](#)
[![opensource](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](#)
[![licence](https://badges.frapsoft.com/os/gpl/gpl.png?v=103)](https://github.com/oae/gnome-shell-pano/blob/master/LICENSE)
[![latest](https://img.shields.io/github/v/release/oae/gnome-shell-pano)](https://github.com/oae/gnome-shell-pano/releases/latest)
[![compare](https://img.shields.io/github/commits-since/oae/gnome-shell-pano/latest/master)](https://github.com/oae/gnome-shell-pano/compare)

![ss](https://i.imgur.com/lyKgmLk.png)

|           General Options            |             Danger Zone              |
| :----------------------------------: | :----------------------------------: |
| ![](https://i.imgur.com/JnWy3CK.png) | ![](https://i.imgur.com/ck5xMrC.png) |

## Supported Shell Versions

- Gnome Shell 42

## Installation

- You need `libgda` and `gsound` for this extension to work.

  - Fedora

    ```bash
    sudo dnf install libgda libgda-sqlite
    ```

  - Arch Linux

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

- `<super>` `<shift>` `v` can be use to toggle visibility of the Pano. This can be changed in Pano extension settings.
- `<ctrl>` `<super>` `<shift>` `v` can be use to toggle incognito mode.
- `left` and `right` arrow keys can be used for navigating between items. Pressing `left` key on the first item will focus search box. Also pressing `right` key will go to first/last focused item on the list.
- `up` and `down` keys can also be use to focus on search box and items
- Typing anywhere on Pano will focus on search box and filter the results.
- `delete` key will remove the focused item from the list.

## Development

### Build

- This extension is written in Typescript and uses rollup to compile it into javascript.
- To start development, install `nodejs` and `gobject-introspection` on your system.

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
