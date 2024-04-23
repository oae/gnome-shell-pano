"""
    pano styles for pygments
    ~~~~~~~~~~~~~~~~~~~~~~

    A style, that suits well with the Pano Color schema

    :license: GPLv2, see LICENSE for details.
"""

from pygments.style import Style
from pygments.token import (
    Comment,
    Error,
    Escape,
    Generic,
    Keyword,
    Literal,
    Name,
    Number,
    Operator,
    Other,
    Punctuation,
    String,
    Whitespace,
)


__all__ = ["PanoStyle"]


class PanoStyle(Style):
    """
    A style, that suits well with the Pano Color schema

    taken from https://github.com/oae/gnome-shell-pano/blob/00fd95d934c64e51d72ce2b0a9c41f3f1362332b/src/utils/pango.ts
    """

    name = "pano"

    background_color = "#3d3846"

    styles = {
        Whitespace: "#BBBBBB",  # class: 'w'
        Error: "border:#BF4040",  # class: 'err'
        #
        Comment: "#636f88",  # class: 'c'
        Comment.Hashbang: "#636f88",  # class: 'ch',
        Comment.Multiline: "#636f88",  # class: 'cm'
        Comment.Preproc: "#636f88",  # class: 'cp'
        Comment.PreprocFile: "#636f88",  # class: 'cpf',
        Comment.Single: "#636f88",  # class: 'c1'
        Comment.Special: "#636f88",  # class: 'cs'
        #
        Keyword: "#81A1C1",  # class: 'k'
        Keyword.Constant: "#81A1C1",  # class: 'kc'
        Keyword.Declaration: "#81A1C1",  # class: 'kd'
        Keyword.Namespace: "#81A1C1",  # class: 'kn'
        Keyword.Pseudo: "#81A1C1",  # class: 'kp'
        Keyword.Reserved: "#81A1C1",  # class: 'kr'
        Keyword.Type: "#81A1C1",  # class: 'kt'
        #
        Operator: "#81A1C1",  # class: 'o'
        Operator.Word: "#81A1C1",  # class: 'ow'
        #
        Name: "#A3BE8C",  # class: 'n'
        Name.Attribute: "#A3BE8C",  # class: 'na'
        Name.Builtin: "#A3BE8C",  # class: 'nb'
        Name.Builtin.Pseudo: "#A3BE8C",  # class: 'bp'
        Name.Class: "#88C0D0",  # class: 'nc'
        Name.Constant: "#81A1C1",  # class: 'no'
        Name.Decorator: "#636f88",  # class: 'nd'
        Name.Entity: "#81A1C1",  # class: 'ni'
        Name.Exception: "#81A1C1",  # class: 'ne'
        Name.Function: "#88C0D0",  # class: 'nf'
        Name.Function.Magic: "",  # class: 'fm',
        Name.Property: "#81A1C1",  # class: 'py'
        Name.Label: "#81A1C1",  # class: 'nl'
        Name.Namespace: "#81A1C1",  # class: 'nn'
        Name.Other: "#81A1C1",  # class: 'nx'
        Name.Tag: "#81A1C1",  # class: 'nt'
        Name.Variable: "#81A1C1",  # class: 'nv'
        Name.Variable.Class: "#88C0D0",  # class: 'vc'
        Name.Variable.Global: "#81A1C1",  # class: 'vg'
        Name.Variable.Instance: "#81A1C1",  # class: 'vi'
        Name.Variable.Magic: "#81A1C1",  # class: 'vm',
        #
        Number: "#B48EAD",  # class: 'm'
        Number.Bin: "#B48EAD",  # class: 'mb',
        Number.Float: "#B48EAD",  # class: 'mf'
        Number.Hex: "#B48EAD",  # class: 'mh'
        Number.Integer: "#B48EAD",  # class: 'mi'
        Number.Integer.Long: "#B48EAD",  # class: 'il'
        Number.Oct: "#B48EAD",  # class: 'mo'
        #
        String: "#A3BE8C",  # class: 's'
        String.Affix: "#A3BE8C",  # class: 'sa',
        String.Backtick: "#A3BE8C",  # class: 'sb'
        String.Char: "#A3BE8C",  # class: 'sc'
        String.Delimiter: "#A3BE8C",  # class: 'dl',
        String.Doc: "#636f88",  # class: 'sd'
        String.Double: "#A3BE8C",  # class: 's2'
        String.Escape: "#A3BE8C",  # class: 'se'
        String.Heredoc: "#636f88",  # class: 'sh'
        String.Interpol: "#A3BE8C",  # class: 'si'
        String.Other: "#A3BE8C",  # class: 'sx'
        String.Regex: "#EBCB8B",  # class: 'sr'
        String.Single: "#A3BE8C",  # class: 's1'
        String.Symbol: "#81A1C1",  # class: 'ss'
        #
        Generic: "",  # class: 'g'
        Generic.Deleted: "#81A1C1",  # class: 'gd',
        Generic.Emph: "italic",  # class: 'ge'
        Generic.EmphStrong: "bold italic",  # class: 'ges',
        Generic.Error: "#BF4040",  # class: 'gr'
        Generic.Heading: "bold #EBCB8B",  # class: 'gh'
        Generic.Inserted: "#A3BE8C",  # class: 'gi'
        Generic.Output: "#A3BE8C",  # class: 'go'
        Generic.Prompt: "#A3BE8C",  # class: 'gp'
        Generic.Strong: "bold",  # class: 'gs'
        Generic.Subheading: "italic #EBCB8B",  # class: 'gu'
        Generic.Traceback: "#A3BE8C",  # class: 'gt'
        #
        Punctuation: "#81A1C1",  # class: 'p',
        Punctuation.Marker: "#81A1C1",  # class: 'pm',
        #
        Escape: "#A3BE8C",  # class: 'esc',
        Other: "#A3BE8C",  # class: 'x',
        Literal: "#81A1C1",  # class: 'l',
        Literal.Date: "#81A1C1",  # class: 'ld',"
    }
