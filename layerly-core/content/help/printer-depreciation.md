---
title: How to correctly calculate 3D printer depreciation cost?
category: printers
categoryLabel: Fleet management
description: Define total machine cost, lifespan and uptime to get accurate RBH in Layerly.
author: Maciej from Layerly
authorInitials: MK
updated: "2024-10-24"
readingTimeMin: 4
toc:
  - id: investment
    label: Total investment
  - id: lifespan
    label: Machine lifespan
  - id: uptime
    label: Calculating uptime
  - id: formula
    label: RBH formula
related:
  - slug: custom-filament-presets
    title: Adding custom material presets
    description: Save favourite filaments in the database so you don't re-enter prices for every quote.
  - slug: waste-and-risk-indicator
    title: What is the waste and risk indicator?
    description: A failed print is still a cost. See how to protect yourself by adding a failure rate.
---

Properly defining equipment depreciation costs is one of the most important elements of running a profitable 3D print farm. Skipping this step often leads to apparent profit that disappears when the machine needs key component replacements.

> **Remember!** Our system uses the cost of one machine work hour (RBH) in quotes. You don't need to calculate anything by hand – just fill in the machine settings correctly.

## 1. Total machine cost (Investment)

To keep calculations accurate, you must consider not only the purchase price of the machine but also the cost of putting it into production. What counts as investment?

- Purchase price of the printer (e.g. Prusa MK4 – 4200 PLN)
- Extra accessories (e.g. dedicated enclosure – 1200 PLN)
- Spare nozzles and initial parts chosen at purchase

## 2. Lifespan

Lifespan is the period after which the machine is technologically obsolete enough that it no longer pays to maintain it. In FDM printing, **3 to 5 years** is typically assumed. After that, the machine's value to the business is zero.

## 3. Uptime percentage

This is a common mistake. A year has 8760 hours. No printer runs 100% of that time. Machines have downtime for:

- Waiting for new orders
- Material changes and bed cleaning
- Repairs and calibration (maintenance)

In Layerly we suggest entering a value between **40% and 60%** uptime per year by default, unless you run 24/7 on large serial contracts.

## Formula used by the system

```
RBH = (Machine cost) / (Lifespan in years × (8760h × Uptime%))
```
