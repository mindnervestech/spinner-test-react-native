import React from "react";
import Spinner from "./components/spinner/Spinner";
import {
  StyleSheet,
  View,
  Text as RNText,
  TouchableOpacity
} from "react-native";

export default class App extends React.Component {
  constructor(props) {
    super(props);
  }

  onStartClick = () => {
    this.spinner.spinWheel();
  };

  onStopClick = () => {
    this.spinner.stopSpinWheel();
  };

  render() {
    return (
      <View style={styles.container}>
        <Spinner onRef={ref => (this.spinner = ref)} />

        <View
          style={{
            flexDirection: "row",
            width: "100%",
            paddingHorizontal: 20,
            paddingBottom: 10,
            justifyContent: "space-around"
          }}
        >
          <TouchableOpacity onPress={this.onStartClick} style={styles.button}>
            <RNText style={styles.buttonTextStyle}>Start</RNText>
          </TouchableOpacity>
          <TouchableOpacity onPress={this.onStopClick} style={styles.button}>
            <RNText style={styles.buttonTextStyle}>Stop</RNText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center"
  },
  button: {
    width: "35%",
    height: 50,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 15
  },
  buttonTextStyle: {
    fontSize: 20,
    color: "white"
  }
});
