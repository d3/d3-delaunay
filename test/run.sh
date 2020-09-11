#!/bin/bash

tape -r esm ${@:-'test/**/*-test.js'} && eslint src
