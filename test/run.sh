#!/bin/bash

tape ${@:-'test/**/*-test.js'} && eslint src
