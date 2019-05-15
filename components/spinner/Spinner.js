import React from "react";
import { GestureHandler, Svg } from "expo";
const { PanGestureHandler, State } = GestureHandler;
import * as d3Shape from "d3-shape";
import { snap } from "@popmotion/popcorn";
import { StyleSheet, View, Dimensions, Animated } from "react-native";
import serverConfig from "../serverConfig/serverUrl";

const { Path, G, Text, TSpan } = Svg;
const { width } = Dimensions.get("screen");
const numberOfSegments = 10;
const wheelSize = width * 0.95;
const fontSize = 26;
const oneTurn = 360;
const angleBySegment = oneTurn / numberOfSegments;
const angleOffset = angleBySegment / 2;
const knobFill = "black";

//function for generating numbers to fill on the wheel
var i = 0;
const generateNumber = () => {
  i = i + 1;
  return i;
};

//function for rendering colors on the wheel
const getColor = () => {
  if (i % 2 == 0) return "gray";
  else return "black";
};

//function for rendering text color on wheel
var j = 0;
const getFontColor = () => {
  j = j + 1;
  if (j % 2 == 0) return "white";
  else return "black";
};

const makeWheel = () => {
  const data = Array.from({ length: numberOfSegments }).fill(1);
  const arcs = d3Shape.pie()(data);
  return arcs.map((arc, index) => {
    const instance = d3Shape
      .arc()
      .padAngle(0.01)
      .outerRadius(width / 2)
      .innerRadius(20);

    return {
      path: instance(arc),
      color: getColor(),
      value: generateNumber(),
      centroid: instance.centroid(arc)
    };
  });
};

export default class Spinner extends React.Component {
  wheelPaths = makeWheel();
  angleAnimate = new Animated.Value(0);
  angle = 0;

  constructor(props) {
    super(props);

    this.state = {
      enabled: false,
      finished: false,
      value: null
    };
  }

  componentDidMount() {
    this.props.onRef(this);

    this.angleAnimate.addListener(event => {
      if (this.state.enabled) {
        this.setState({
          enabled: false,
          finished: false
        });
      }
      this.angle = event.value;
    });
  }
  //method for rendering knob at the top of wheel
  renderKnob = () => {
    const knobSize = 30;
    const YOLO = Animated.modulo(
      Animated.divide(
        Animated.modulo(
          Animated.subtract(this.angleAnimate, angleOffset),
          oneTurn
        ),
        new Animated.Value(angleBySegment)
      ),
      1
    );
    return (
      <Animated.View
        style={{
          width: knobSize,
          height: knobSize * 2,
          justifyContent: "flex-end",
          zIndex: 1,
          transform: [
            {
              rotate: YOLO.interpolate({
                inputRange: [-1, -0.5, -0.0001, 0.0001, 0.5, 1],
                outputRange: ["0deg", "0deg", "35deg", "-35deg", "0deg", "0deg"]
              })
            }
          ]
        }}
      >
        <Svg
          width={knobSize}
          height={(knobSize * 100) / 57}
          viewBox={`0 0 57 100`}
          style={{ transform: [{ translateY: 8 }] }}
        >
          <Path
            d="M28.034,0C12.552,0,0,12.552,0,28.034S28.034,100,28.034,100s28.034-56.483,28.034-71.966S43.517,0,28.034,0z   M28.034,40.477c-6.871,0-12.442-5.572-12.442-12.442c0-6.872,5.571-12.442,12.442-12.442c6.872,0,12.442,5.57,12.442,12.442  C40.477,34.905,34.906,40.477,28.034,40.477z"
            fill={knobFill}
          />
        </Svg>
      </Animated.View>
    );
  };
  //for get value of current number on the knob
  getSelectedValue = () => {
    this.angle = this.angle > 0 ? -(360 - this.angle) : this.angle;
    const deg = Math.abs(Math.round(this.angle % oneTurn));
    return Math.floor(deg / angleBySegment);
  };

  //method called when start button is pushed
  spinWheel() {
    Animated.decay(this.angleAnimate, {
      velocity: 2000 / 1000,
      deceleration: 0.999,
      useNativeDriver: true
    }).start(() => {
      this.angleAnimate.setValue(this.angle % oneTurn);
      const snapTo = snap(oneTurn / numberOfSegments);
      Animated.timing(this.angleAnimate, {
        toValue: snapTo(this.angle),
        duration: 300,
        useNativeDriver: true
      }).start(() => {
        const selectedValue = this.getSelectedValue();
        this.setState({
          enabled: true,
          finished: true,
          value: this.wheelPaths[selectedValue].value
        });
      });
    });
    this.saveNumber();
  }

  //method call on stop button pushed
  stopSpinWheel() {
    Animated.decay(this.angleAnimate, {
      velocity: 2000 / 1000,
      deceleration: 0.999,
      useNativeDriver: true
    }).stop(() => {
      this.angleAnimate.setValue(this.angle % oneTurn);
      const snapTo = snap(oneTurn / numberOfSegments);
      Animated.timing(this.angleAnimate, {
        toValue: snapTo(this.angle),
        duration: 300,
        useNativeDriver: true
      }).stop(() => {
        const selectedValue = this.getSelectedValue();
        this.setState({
          enabled: true,
          finished: true,
          value: this.wheelPaths[selectedValue].value
        });
      });
    });
  }

  //handling wheel gestures on these method
  handleWheelGesture = ({ nativeEvent }) => {
    if (nativeEvent.state === State.END) {
      const { velocityY } = nativeEvent;

      Animated.decay(this.angleAnimate, {
        velocity: velocityY / 1000,
        deceleration: 0.999,
        useNativeDriver: true
      }).start(() => {
        this.angleAnimate.setValue(this.angle % oneTurn);
        const snapTo = snap(oneTurn / numberOfSegments);
        Animated.timing(this.angleAnimate, {
          toValue: snapTo(this.angle),
          duration: 300,
          useNativeDriver: true
        }).start(() => {
          const selectedValue = this.getSelectedValue();
          this.setState({
            enabled: true,
            finished: true,
            value: this.wheelPaths[selectedValue].value
          });
        });
        this.saveNumber();
      });
    }
  };

  saveNumber() {
    setTimeout(() => {
      fetch(serverConfig.serverUrl + "/api/prizes", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          pNumber: this.state.value
        })
      })
        .then(responseJson => {
          console.log(responseJson);
        })
        .catch(error => {
          console.error(error);
        });
    }, 5000);
  }

  render() {
    return (
      <PanGestureHandler onHandlerStateChange={this.handleWheelGesture}>
        <View style={styles.container}>
          {this.renderKnob()}
          <Animated.View
            style={{
              alignItems: "center",
              justifyContent: "center",
              transform: [
                {
                  rotate: this.angleAnimate.interpolate({
                    inputRange: [-oneTurn, 0, oneTurn],
                    outputRange: [`-${oneTurn}deg`, `0deg`, `${oneTurn}deg`]
                  })
                }
              ]
            }}
          >
            <Svg
              width={wheelSize}
              height={wheelSize}
              viewBox={`0 0 ${width} ${width}`}
              style={{ transform: [{ rotate: `-${angleOffset}deg` }] }}
            >
              <G y={width / 2} x={width / 2}>
                {this.wheelPaths.map((arc, i) => {
                  const [x, y] = arc.centroid;
                  const number = arc.value.toString();

                  return (
                    <G key={`arc-${i}`}>
                      <Path d={arc.path} fill={arc.color} />
                      <G
                        rotation={
                          (i * oneTurn) / numberOfSegments + angleOffset
                        }
                        origin={`${x}, ${y}`}
                      >
                        <Text
                          x={x}
                          y={y - 70}
                          fill={getFontColor()}
                          textAnchor="middle"
                          fontSize={fontSize}
                        >
                          {Array.from({ length: number.length }).map((_, j) => {
                            return (
                              <TSpan
                                x={x}
                                dy={fontSize}
                                key={`arc-${i}-slice-${j}`}
                              >
                                {number.charAt(j)}
                              </TSpan>
                            );
                          })}
                        </Text>
                      </G>
                    </G>
                  );
                })}
              </G>
            </Svg>
          </Animated.View>
        </View>
      </PanGestureHandler>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  }
});
