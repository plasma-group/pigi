#!/bin/bash

mkdir -p log
yarn run validator 2>&1 | tee log/aggregator.$(uuidgen).log
