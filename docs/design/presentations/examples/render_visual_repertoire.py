#!/usr/bin/env python3
"""Render original chart-form examples; synthetic fixtures never enter research."""
import json
from pathlib import Path
import subprocess

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.colors import LinearSegmentedColormap
from matplotlib.ticker import MaxNLocator

HERE = Path(__file__).resolve().parent
PAPER, INK, GOLD, GRAY, RULE = "#F5F3EE", "#1B1915", "#7A5510", "#817B70", "#D8D3C7"


def main():
    data = json.loads((HERE / "visual-repertoire-data.json").read_text())
    font = subprocess.check_output(["fc-match", "-f", "%{file}", "Archivo"], text=True)
    font_manager.fontManager.addfont(font)
    assert font_manager.FontProperties(fname=font).get_name() == "Archivo", "Install legitimate Archivo first"
    plt.rcParams.update({"font.family": "Archivo", "font.size": 14, "text.color": INK,
                         "axes.labelcolor": INK, "xtick.color": INK, "ytick.color": INK,
                         "svg.fonttype": "none", "svg.hashsalt": "smpt-visual-repertoire-v1", "axes.titleweight": "bold"})
    fig, axs = plt.subplots(3, 2, figsize=(14, 14), facecolor=PAPER)
    fig.subplots_adjust(top=.82, bottom=.07, left=.09, right=.96, wspace=.30, hspace=.65)
    fig.text(.07, .963, "SMPT  /  EXHIBIT REPERTOIRE", fontsize=17, color=GOLD, weight="bold")
    fig.text(.07, .925, "Different questions, different graphic forms", fontsize=28, weight="bold")
    fig.text(.07, .895, "Synthetic examples only. No company, project or investment findings.", fontsize=15)

    def style(ax, title, subtitle):
        ax.set_facecolor(PAPER)
        ax.set_title(title, loc="left", fontsize=19, pad=33)
        ax.text(0, 1.065, subtitle, transform=ax.transAxes, fontsize=12, color="#5B5548")
        for side in ["top", "right"]:
            ax.spines[side].set_visible(False)
        for side in ["bottom", "left"]:
            ax.spines[side].set_color(RULE)
        ax.tick_params(length=0, labelsize=12)

    ax = axs[0, 0]; style(ax, "1  Ranked comparison", "A common baseline makes the ordering visible")
    d = data["ranked_comparison"]; pairs = sorted(zip(d["labels"], d["values"]), key=lambda x: x[1])
    ax.barh([x[0] for x in pairs], [x[1] for x in pairs], height=.46, color=[GRAY, GRAY, GOLD])
    for i, (_, v) in enumerate(pairs):
        ax.text(v + 2, i, str(v), va="center", weight="bold")
    ax.set_xlim(0, 100); ax.set_xticks([0, 50, 100]); ax.set_xlabel("Illustrative units", fontsize=12)

    ax = axs[0, 1]; style(ax, "2  Paired observations", "Direct labels show the direction and magnitude")
    d = data["paired_observations"]
    for i, (name, start, end) in enumerate(zip(d["labels"], d["start"], d["end"], strict=True)):
        color = GOLD if i == 0 else GRAY
        ax.plot([0, 1], [start, end], color=color, marker="o", linewidth=2)
        ax.text(-.06, start, f"{name}: {start}", ha="right", va="center", fontsize=12)
        ax.text(1.06, end, str(end), va="center", weight="bold", fontsize=13)
    ax.set_xlim(-.5, 1.4); ax.set_ylim(0, 50); ax.set_xticks([0, 1], ["Period 1", "Period 2"])
    ax.set_yticks([0, 25, 50]); ax.set_ylabel("Illustrative units", fontsize=12)

    ax = axs[1, 0]; style(ax, "3  Financial bridge", "Opening + signed changes = closing")
    d = data["bridge"]; vals = d["values"]
    assert sum(vals[:-1]) == vals[-1], "Synthetic bridge must reconcile"
    current = vals[0]
    for i, value in enumerate(vals):
        total = i in [0, len(vals)-1]
        before, after = (0, value) if total else (current, current+value)
        ax.bar(i, abs(after-before), bottom=min(before, after), width=.58, color=GOLD if total else GRAY)
        ax.text(i, max(before, after)+4, f"{value:+}" if not total else str(value), ha="center", fontsize=13, weight="bold")
        if not total: current = after
        if i < len(vals)-1: ax.plot([i+.29, i+.71], [after, after], color=GRAY, linewidth=1)
    ax.set_ylim(0, 120); ax.set_xticks(range(len(vals)), d["labels"], fontsize=11)
    ax.set_yticks([0, 50, 100]); ax.set_ylabel("Illustrative units", fontsize=12)

    ax = axs[1, 1]; style(ax, "4  Small multiples", "Shared axes make separate series comparable")
    ax.set_axis_off(); d = data["small_multiples"]
    for i, (name, values) in enumerate(d["series"].items()):
        child = ax.inset_axes([i*.55, .08, .44, .88]); child.set_facecolor(PAPER)
        child.plot(d["periods"], values, color=GOLD, marker="o", linewidth=2)
        child.set_ylim(0, 100); child.set_xlim(1, 4); child.set_xticks([1, 4], ["P1", "P4"])
        child.set_yticks([0, 50, 100]); child.set_title(name, fontsize=13, loc="left")
        child.tick_params(length=0, labelsize=11)
        for side in ["top", "right"]: child.spines[side].set_visible(False)
        for side in ["bottom", "left"]: child.spines[side].set_color(RULE)
        child.text(4, values[-1]+7, str(values[-1]), fontsize=12, ha="right", weight="bold")

    ax = axs[2, 0]; style(ax, "5  Parallel milestones", "Hypothetical days; open marker indicates a target")
    d = data["timeline"]
    for row, key in [(1, "finance"), (0, "industrial")]:
        events = d[key]
        ax.plot([events[0]["day"], events[-1]["day"]], [row, row], color=GRAY, linewidth=1.3,
                linestyle="--" if key == "industrial" else "-")
        for event in events:
            expected = event["status"] == "expected"
            ax.plot(event["day"], row, marker="o", markersize=10, markeredgecolor=GOLD,
                    markerfacecolor=PAPER if expected else GOLD, markeredgewidth=2)
            ax.text(event["day"], row+.22, event["label"], ha="center", fontsize=12)
    ax.set_xlim(-3, 44); ax.set_ylim(-.5, 1.7); ax.set_yticks([0, 1], ["Industrial", "Finance"])
    ax.set_xticks([0, 10, 20, 40]); ax.set_xlabel("Hypothetical days; sequence only", fontsize=12)

    ax = axs[2, 1]; style(ax, "6  Sensitivity heatmap", "Each cell is an explicit illustrative output")
    d = data["sensitivity"]
    assert all(len(row) == len(d["cost"]) for row in d["output"])
    cmap = LinearSegmentedColormap.from_list("SMPT", [PAPER, "#D8C9AD", GOLD])
    ax.pcolormesh([-.5,.5,1.5,2.5], [-.5,.5,1.5,2.5], d["output"], cmap=cmap, vmin=0, vmax=12)
    ax.set_ylim(2.5, -.5)
    for i, row in enumerate(d["output"]):
        for j, val in enumerate(row):
            rgb = cmap(val/12)[:3]
            luminance = sum(w*(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4)
                            for w, v in zip((.2126,.7152,.0722), rgb, strict=True))
            color = "white" if luminance < .18 else INK
            ax.text(j, i, str(val), ha="center", va="center", color=color, weight="bold")
    ax.set_xticks(range(len(d["cost"])), d["cost"]); ax.set_yticks(range(len(d["delay"])), d["delay"])
    ax.set_xlabel("Illustrative cost", fontsize=12); ax.set_ylabel("Illustrative delay", fontsize=12)
    fig.text(.07, .025, "Original SMPT designs • Fixture data and generator accompany this gallery • Archivo typography", fontsize=12, color="#5B5548")
    dest = HERE / "05-visual-repertoire"
    fig.savefig(dest.with_suffix(".svg"), facecolor=PAPER, metadata={"Title":"Original SMPT exhibit repertoire", "Description":data["classification"], "Date":None})
    svg = dest.with_suffix(".svg")
    svg.write_text("\n".join(line.rstrip() for line in svg.read_text().splitlines())+"\n")
    fig.savefig(dest.with_suffix(".png"), facecolor=PAPER, dpi=110)
    plt.close(fig)
    print("Rendered six original illustrative patterns; bridge and fixture dimensions verified")


if __name__ == "__main__":
    main()
