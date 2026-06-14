#!/bin/bash
wget --no-verbose --tries=1 --spider http://localhost:5678/healthz || exit 1
