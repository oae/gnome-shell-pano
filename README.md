# Pano - Next-gen Clipboard Manager

[![ts](https://badgen.net/badge/icon/typescript?icon=typescript&label)](#)
[![opensource](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](#)
[![licence](https://badges.frapsoft.com/os/gpl/gpl.png?v=103)](https://github.com/oae/gnome-shell-pano/blob/master/LICENSE)
[![latest](https://img.shields.io/github/v/release/oae/gnome-shell-pano)](https://github.com/oae/gnome-shell-pano/releases/latest)
[![compare](https://img.shields.io/github/commits-since/oae/gnome-shell-pano/latest/master)](https://github.com/oae/gnome-shell-pano/compare)

![ss](https://i.imgur.com/lksT9iR.png)

## Supported Shell Versions

- Gnome Shell 42

## Installation

- You need `libgda` for this extension to work.

  - Fedora

    ```bash
    sudo dnf install libgda libgda-sqlite
    ```

  - Arch Linux

    ```bash
    sudo pacman -S libgda
    ```

  - Ubuntu

    ```bash
    sudo apt install gir1.2-gda-5.0
    ```

- You can install the extension from [**here**](https://extensions.gnome.org/extension/5278/pano/)

## Development

### Build

- This extension is written in Typescript and uses rollup to compile it into javascript.
- To start development, you need nodejs installed on your system;

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
