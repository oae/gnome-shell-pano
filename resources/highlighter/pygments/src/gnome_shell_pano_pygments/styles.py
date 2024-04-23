"""
    pano styles for pygments
    ~~~~~~~~~~~~~~~~~~~~~~

    A style, that suits well with the Pano Color schema

    :license: GPLv2, see LICENSE for details.
"""

from pygments.style import Style
from pygments.token import (
    Keyword,
    Name,
    Comment,
    String,
    Error,
    Number,
    Operator,
    Generic,
    Whitespace,
    Escape,
    Punctuation,
    Other,
    Literal,
)


__all__ = ["PanoStyle"]


class PanoStyle(Style):
    """
    A style, that suits well with the Pano Color schema

    taken from https://github.com/oae/gnome-shell-pano/blob/00fd95d934c64e51d72ce2b0a9c41f3f1362332b/src/utils/pango.ts
    """

    name = "pano"

    styles = {
        Whitespace: "",  # class: 'w'
        Error: "#BF4040",  # class: 'err'
        #
        Comment: "#636f88",  # class: 'c'
        Comment.Hashbang: "",  # class: 'ch',
        Comment.Multiline: "",  # class: 'cm'
        Comment.Preproc: "#636f88",  # class: 'cp'
        Comment.PreprocFile: "",  # class: 'cpf',
        Comment.Single: "",  # class: 'c1'
        Comment.Special: "",  # class: 'cs'
        #
        Keyword: "#81A1C1",  # class: 'k'
        Keyword.Constant: "#81A1C1",  # class: 'kc'
        Keyword.Declaration: "",  # class: 'kd'
        Keyword.Namespace: "",  # class: 'kn'
        Keyword.Pseudo: "",  # class: 'kp'
        Keyword.Reserved: "",  # class: 'kr'
        Keyword.Type: "",  # class: 'kt'
        #
        Operator: "#81A1C1",  # class: 'o'
        Operator.Word: "",  # class: 'ow'
        #
        Name: "#A3BE8C",  # class: 'n'
        Name.Attribute: "#A3BE8C",  # class: 'na'
        Name.Builtin: "#A3BE8C",  # class: 'nb'
        Name.Builtin.Pseudo: "",  # class: 'bp'
        Name.Class: "#88C0D0",  # class: 'nc'
        Name.Constant: "#81A1C1",  # class: 'no'
        Name.Decorator: "#636f88",  # class: 'nd'
        Name.Entity: "#81A1C1",  # class: 'ni'
        Name.Exception: "",  # class: 'ne'
        Name.Function: "#88C0D0",  # class: 'nf'
        Name.Function.Magic: "",  # class: 'fm',
        Name.Property: "#81A1C1",  # class: 'py'
        Name.Label: "",  # class: 'nl'
        Name.Namespace: "",  # class: 'nn'
        Name.Other: "",  # class: 'nx'
        Name.Tag: "#81A1C1",  # class: 'nt'
        Name.Variable: "#81A1C1",  # class: 'nv'
        Name.Variable.Class: "#88C0D0",  # class: 'vc'
        Name.Variable.Global: "",  # class: 'vg'
        Name.Variable.Instance: "",  # class: 'vi'
        Name.Variable.Magic: "",  # class: 'vm',
        #
        Number: "#B48EAD",  # class: 'm'
        Number.Bin: "",  # class: 'mb',
        Number.Float: "",  # class: 'mf'
        Number.Hex: "",  # class: 'mh'
        Number.Integer: "",  # class: 'mi'
        Number.Integer.Long: "",  # class: 'il'
        Number.Oct: "",  # class: 'mo'
        #
        String: "#A3BE8C",  # class: 's'
        String.Affix: "",  # class: 'sa',
        String.Backtick: "",  # class: 'sb'
        String.Char: "#A3BE8C",  # class: 'sc'
        String.Delimiter: "",  # class: 'dl',
        String.Doc: "#636f88",  # class: 'sd'
        String.Double: "",  # class: 's2'
        String.Escape: "",  # class: 'se'
        String.Heredoc: "#636f88",  # class: 'sh'
        String.Interpol: "#A3BE8C",  # class: 'si'
        String.Other: "",  # class: 'sx'
        String.Regex: "#EBCB8B",  # class: 'sr'
        String.Single: "",  # class: 's1'
        String.Symbol: "#81A1C1",  # class: 'ss'
        #
        Generic: "",  # class: 'g'
        Generic.Deleted: "#81A1C1",  # class: 'gd',
        Generic.Emph: "italic",  # class: 'ge'
        Generic.EmphStrong: "bold italic",  # class: 'ges',
        Generic.Error: "",  # class: 'gr'
        Generic.Heading: "",  # class: 'gh'
        Generic.Inserted: "#A3BE8C",  # class: 'gi'
        Generic.Output: "",  # class: 'go'
        Generic.Prompt: "",  # class: 'gp'
        Generic.Strong: "bold",  # class: 'gs'
        Generic.Subheading: "",  # class: 'gu'
        Generic.Traceback: "",  # class: 'gt'
        #
        Punctuation: "#81A1C1",  # class: 'p',
        Punctuation.Marker: "",  # class: 'pm',
        #
        Escape: "",  # class: 'esc',
        Other: "",  # class: 'x',
        Literal: "#81A1C1",  # class: 'l',
        Literal.Date: "",  # class: 'ld',"
    }
