---
name: Bug report
about: Create a report to help us improve
title: ''
labels: bug
assignees: ''
---

## Description

**What is the bug?**

### Problem Explanation

Write a clear and concise description of what the bug is:

The bug happens when ...

### Expected Behavior

A clear and concise description of what you expected to happen, and how the actual outcome differs:

- Pano shouldn't ...
- It should behave ...

## Reprodution

**How one can find the bug?**

### Steps To Reproduce

Steps to reproduce, if applicable:

1. Open application ...
2. Put the focus on ...
3. Press the gnome shortcut `<super>` `<shift>` `v` and ...
4. See the bug happening in the ...

### Details

Mark with [ ] all that applies:

#### It happens with any application?

- [ ] Yes, it applies to any application.
- [ ] No. Only with the following applications:
  - VSCode
- [ ] It works with the following applications that I have tried:
  - Fill in a list with any application that applies

#### It happens only on one computer?

- [ ] I don't know.
- [ ] No. I have tried it on more than one computer.

#### It happens only with some specific gnome configuration?

- [ ] I don't think that the configuration matters.
- [ ] Yes. Only if the following config is set up:
  - Fill in a list with any configuration tha applies.

#### It happens only with some specific extension installed?

- [ ] I don't think that the installed extensions affect the bug/behavior.
- [ ] Yes. Only if the following gnome extension is installed:
  - Fill in a list with any extension tha applies.
  - Fill in also any detail about the extensions that applies.

## Diagnostics

**Under what conditions does it happen?**

Fill in all information that applies:

### Environment

- GNOME Shell version: ...
- Distro: ...
- Distro version: ...

### Screenshots

If applicable, add screenshots to help explain your problem:

#### Screenshot 1 description

...

#### Screenshot 2 description

...

### Application Details

#### What is pasted, if applicable

``` text
...
```

#### Application Version

``` bash
$ app --version  # ...
1.74.3
```

### Output and Logs

#### Gnome

**Command:** `journalctl --since=now --follow /usr/bin/gnome-shell`

``` bash
$ journalctl --since=now --follow /usr/bin/gnome-shell
...
```

#### Pano Configuration

**Command:** `dconf dump /org/gnome/shell/extensions/pano/`

``` bash
$ dconf dump /org/gnome/shell/extensions/pano/
...
```

#### Enabled Extensions

**Command:** `dconf read /org/gnome/shell/enabled-extensions | tr ' ' '\n'`

``` bash
$ dconf read /org/gnome/shell/enabled-extensions | tr ' ' '\n'
...
```
