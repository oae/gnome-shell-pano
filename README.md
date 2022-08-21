# Pano - Next-gen Clipboard Manager

[![ts](https://badgen.net/badge/icon/typescript?icon=typescript&label)](#)
[![opensource](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](#)
[![licence](https://badges.frapsoft.com/os/gpl/gpl.png?v=103)](https://github.com/oae/gnome-shell-pano/blob/master/LICENSE)
[![latest](https://img.shields.io/github/v/release/oae/gnome-shell-pano)](https://github.com/oae/gnome-shell-pano/releases/latest)
[![compare](https://img.shields.io/github/commits-since/oae/gnome-shell-pano/latest/master)](https://github.com/oae/gnome-shell-pano/compare)

![ss](https://i.imgur.com/0p6LRGw.png)

## Installation

You can install it from [**here**](https://extensions.gnome.org)

## Development

### Requirements

- Fedora

  ```bash
  dnf install libsoup3-devel libgda-devel libgda-sqlite json-glib-devel gjs-devel gsettings-desktop-schemas-devel gcr-devel polkit-devel libnma-gtk4-devel libsoup-devel gtk3-devel atk-devel gtk4-devel gobject-introspection gobject-introspection-devel libgda
  ```

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
